import {
  FinishReason,
  MatchConfig,
  MatchQuestion,
  MatchState,
  PlayerRecord,
  PublicMatchQuestion,
  SubmissionRecord,
  WinnerCheckResult
} from './types.js';
import { getScoringMode, MatchContext, ScoringMode } from './scoringMode.js';
import { sanitizeQuestionForClient } from './questionSelector.js';
import { RunResult } from '../runner/types.js';

export interface MatchListener {
  onStateChange?(match: Match): void;
  onFinished?(match: Match, reason: FinishReason, winnerId: string | null): void;
}

export class Match implements MatchContext {
  public id: string;
  public roomCode?: string;
  public state: MatchState = 'waiting';
  public questions: MatchQuestion[];
  public players: Map<string, PlayerRecord> = new Map();
  public socketToPlayer: Map<string, string> = new Map();
  public pendingSubmissions: Map<string, SubmissionRecord> = new Map();
  public submissionsHistory: SubmissionRecord[] = [];
  
  public startedAt = 0;
  public countdownStartsAt = 0;
  public timeCapAt = 0;
  public finishedAt = 0;
  public winnerId: string | null = null;
  public finishReason: FinishReason | null = null;

  public pendingWinnerCheck: { candidateId: string; expiresAt: number } | null = null;
  private scoringMode: ScoringMode;
  public config: MatchConfig;
  private listeners: MatchListener[] = [];

  constructor(id: string, questions: MatchQuestion[], config: MatchConfig, roomCode?: string) {
    this.id = id;
    this.roomCode = roomCode;
    this.questions = questions;
    this.config = config;
    this.scoringMode = getScoringMode(config.scoringMode);
  }

  public addListener(listener: MatchListener): void {
    this.listeners.push(listener);
  }

  public addPlayer(player: { playerId: string; nickname: string; language: string; socketId: string }): void {
    if (this.state !== 'waiting') {
      throw new Error('Cannot join match: match already in progress or completed.');
    }
    if (this.players.size >= 2) {
      throw new Error('Cannot join match: room is full.');
    }

    const record: PlayerRecord = {
      playerId: player.playerId,
      nickname: player.nickname,
      language: player.language,
      socketId: player.socketId,
      connected: true,
      score: 0,
      currentIndex: 0,
      solvedQuestionIds: new Set(),
      firstPassTimeMs: new Map(),
      submissionsCount: new Map(),
      lastSubmissionTime: 0
    };

    this.players.set(player.playerId, record);
    this.socketToPlayer.set(player.socketId, player.playerId);
    this.notifyStateChange();
  }

  public startCountdown(): void {
    if (this.players.size !== 2) {
      throw new Error('Cannot start match: exactly 2 players required.');
    }
    this.state = 'countdown';
    this.countdownStartsAt = Date.now();
    this.notifyStateChange();
  }

  public startMatch(): void {
    this.state = 'in_progress';
    this.startedAt = Date.now();
    this.timeCapAt = this.startedAt + this.config.timeCapSec * 1000;
    this.notifyStateChange();
  }

  public handleDisconnect(socketId: string): void {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return;

    const player = this.players.get(playerId);
    if (!player) return;

    player.connected = false;
    player.disconnectedAt = Date.now();
    this.socketToPlayer.delete(socketId);

    // If still in waiting room, remove player or clean up
    if (this.state === 'waiting' || this.state === 'countdown') {
      this.players.delete(playerId);
      this.notifyStateChange();
    }
  }

  public handleReconnect(playerId: string, newSocketId: string): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    // Disconnect old socket association if still present
    if (player.socketId) {
      this.socketToPlayer.delete(player.socketId);
    }

    player.socketId = newSocketId;
    player.connected = true;
    player.disconnectedAt = undefined;
    this.socketToPlayer.set(newSocketId, playerId);

    this.notifyStateChange();
    return true;
  }

  public registerSubmission(playerId: string, questionId: string, code: string, submissionId: string, bypassRateLimit = false): SubmissionRecord {
    if (this.state !== 'in_progress') {
      throw new Error('Submissions are only accepted while match is in progress.');
    }

    const player = this.players.get(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} is not part of this match.`);
    }

    const now = Date.now();

    // 1. Rate Limit: 1 submission per 2 seconds
    if (!bypassRateLimit && now - player.lastSubmissionTime < 2000) {
      throw new Error('Rate limit exceeded: please wait at least 2 seconds between submissions.');
    }

    // 2. Max 30 submissions per question
    const currentCount = player.submissionsCount.get(questionId) || 0;
    if (currentCount >= 30) {
      throw new Error(`Submission limit reached: maximum 30 attempts per question.`);
    }

    player.lastSubmissionTime = now;
    player.submissionsCount.set(questionId, currentCount + 1);

    const submission: SubmissionRecord = {
      id: submissionId,
      matchId: this.id,
      playerId,
      questionId,
      language: player.language,
      code,
      receivedAt: now,
      isEvaluating: true
    };

    this.pendingSubmissions.set(submission.id, submission);
    return submission;
  }

  public handleSubmissionResult(submissionId: string, result: RunResult): WinnerCheckResult {
    const submission = this.pendingSubmissions.get(submissionId);
    if (!submission) {
      return { finished: false, winnerId: null };
    }

    submission.isEvaluating = false;
    submission.evaluatedAt = Date.now();
    submission.verdict = result.verdict;
    submission.publicMessage = result.publicMessage;
    submission.timeMs = result.timeMs;

    this.submissionsHistory.push({ ...submission });
    this.pendingSubmissions.delete(submissionId);

    const player = this.players.get(submission.playerId);
    if (!player) {
      return { finished: false, winnerId: null };
    }

    const isPass = result.verdict === 'passed';
    const check = this.scoringMode.onSubmissionResult(this, player, submission.questionId, submission, isPass);

    if (check.finished) {
      this.finish(check.reason || 'completed', check.winnerId);
    } else {
      // Check if this resolved submission clears an earlier pending winner check
      this.evaluatePendingWinner();
      this.notifyStateChange();
    }

    return check;
  }

  public setPendingWinnerCheck(candidateId: string, timeoutMs: number): void {
    this.pendingWinnerCheck = {
      candidateId,
      expiresAt: Date.now() + timeoutMs
    };
  }

  private evaluatePendingWinner(): void {
    if (!this.pendingWinnerCheck) return;

    const candidate = this.players.get(this.pendingWinnerCheck.candidateId);
    if (!candidate) {
      this.pendingWinnerCheck = null;
      return;
    }

    // Check if opponent still has earlier evaluating submissions
    const opponent = [...this.players.values()].find((p) => p.playerId !== candidate.playerId);
    const hasEarlier = opponent
      ? [...this.pendingSubmissions.values()].some((s) => s.playerId === opponent.playerId && s.isEvaluating)
      : false;

    if (!hasEarlier || Date.now() >= this.pendingWinnerCheck.expiresAt) {
      // Deferral period finished or all earlier submissions arrived
      const winnerId = candidate.playerId;
      this.pendingWinnerCheck = null;
      this.finish('completed', winnerId);
    }
  }

  public skipQuestion(playerId: string): void {
    const player = this.players.get(playerId);
    if (player && this.state === 'in_progress') {
      player.currentIndex = Math.min(player.currentIndex + 1, this.questions.length - 1);
      this.notifyStateChange();
    }
  }

  public surrender(playerId: string): void {
    if (this.state !== 'in_progress' && this.state !== 'countdown') return;

    const opponent = [...this.players.values()].find((p) => p.playerId !== playerId);
    this.finish('forfeit', opponent?.playerId || null);
  }

  public tick(): void {
    if (this.state === 'countdown') {
      if (Date.now() - this.countdownStartsAt >= 3000) {
        this.startMatch();
      }
      return;
    }

    if (this.state !== 'in_progress') return;

    const now = Date.now();

    // 1. Time Cap check
    if (now >= this.timeCapAt) {
      const result = this.scoringMode.checkTimeCap(this);
      this.finish(result.reason || 'time_cap', result.winnerId);
      return;
    }

    // 2. Disconnect 30s Grace Period check
    for (const player of this.players.values()) {
      if (!player.connected && player.disconnectedAt) {
        if (now - player.disconnectedAt >= this.config.reconnectGraceSec * 1000) {
          const opponent = [...this.players.values()].find((p) => p.playerId !== player.playerId);
          this.finish('forfeit', opponent?.playerId || null);
          return;
        }
      }
    }

    // 3. Pending Winner fairness check
    if (this.pendingWinnerCheck) {
      this.evaluatePendingWinner();
    }
  }

  public finish(reason: FinishReason, winnerId: string | null): void {
    if (this.state === 'finished') return;

    this.state = 'finished';
    this.finishReason = reason;
    this.winnerId = winnerId;
    this.finishedAt = Date.now();

    for (const listener of this.listeners) {
      try {
        if (listener.onFinished) listener.onFinished(this, reason, winnerId);
      } catch (err) {
        console.error('Error in onFinished listener:', err);
      }
    }

    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    for (const listener of this.listeners) {
      try {
        if (listener.onStateChange) listener.onStateChange(this);
      } catch (err) {
        console.error('Error in onStateChange listener:', err);
      }
    }
  }

  public getPublicQuestions(): PublicMatchQuestion[] {
    return this.questions.map(sanitizeQuestionForClient);
  }

  public getPublicState() {
    return {
      matchId: this.id,
      roomCode: this.roomCode,
      status: this.state,
      serverTime: Date.now(),
      startedAt: this.startedAt,
      timeCapAt: this.timeCapAt,
      countdownStartsAt: this.countdownStartsAt,
      winnerId: this.winnerId,
      finishReason: this.finishReason,
      players: [...this.players.values()].map((p) => ({
        playerId: p.playerId,
        nickname: p.nickname,
        language: p.language,
        socketId: p.socketId,
        connected: p.connected,
        score: p.score,
        currentIndex: p.currentIndex,
        solvedCount: p.solvedQuestionIds.size,
        solvedQuestionIds: [...p.solvedQuestionIds]
      })),
      questions: this.getPublicQuestions()
    };
  }
}
