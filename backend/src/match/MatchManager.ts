import crypto from 'crypto';
import { Match } from './Match.js';
import { selectMatchQuestions } from './questionSelector.js';
import { MatchConfig } from './types.js';
import { persistMatch } from './persistence.js';

export interface QueueEntry {
  playerId: string;
  nickname: string;
  language: string;
  socketId: string;
  queuedAt: number;
}

export class MatchManager {
  private matches: Map<string, Match> = new Map();
  private roomCodeToMatch: Map<string, Match> = new Map();
  private socketToMatch: Map<string, Match> = new Map();
  private queue: QueueEntry[] = [];
  private tickInterval: NodeJS.Timeout | null = null;

  private defaultConfig: MatchConfig = {
    questionCount: parseInt(process.env.MATCH_QUESTION_COUNT || '8', 10),
    timeCapSec: parseInt(process.env.MATCH_TIME_CAP_SEC || '2100', 10),
    reconnectGraceSec: parseInt(process.env.RECONNECT_GRACE_SEC || '120', 10),
    scoringMode: (process.env.MATCH_MODE || 'sprint').toLowerCase() === 'race' ? 'race' : 'sprint',
    matchSameLanguage: process.env.MATCH_SAME_LANGUAGE === 'true'
  };

  constructor() {
    this.startTickLoop();
  }

  public destroy(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private startTickLoop(): void {
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 500);
  }

  private tick(): void {
    for (const match of this.matches.values()) {
      match.tick();
      if (match.state === 'finished' && Date.now() - match.finishedAt > 45000) {
        // Clean up match from active memory 45s after completion
        this.cleanupMatch(match);
      }
    }
  }

  private cleanupMatch(match: Match): void {
    this.matches.delete(match.id);
    if (match.roomCode) {
      this.roomCodeToMatch.delete(match.roomCode);
    }
    for (const p of match.players.values()) {
      this.socketToMatch.delete(p.socketId);
    }
  }

  public joinQueue(player: { playerId: string; nickname: string; language: string; socketId: string }): { matched: boolean; match?: Match } {
    // Remove if already in queue
    this.leaveQueue(player.socketId);

    // Look for compatible opponent in queue
    const opponentIdx = this.queue.findIndex((entry) => {
      if (this.defaultConfig.matchSameLanguage) {
        return entry.language === player.language;
      }
      return true;
    });

    if (opponentIdx !== -1) {
      const [opponent] = this.queue.splice(opponentIdx, 1);
      const matchId = `match_${crypto.randomBytes(4).toString('hex')}`;
      const questions = selectMatchQuestions({
        languages: [player.language, opponent.language],
        count: this.defaultConfig.questionCount
      });

      const match = new Match(matchId, questions, { ...this.defaultConfig });
      match.addListener({
        onFinished: (m) => persistMatch(m)
      });

      match.addPlayer(opponent);
      match.addPlayer(player);

      this.matches.set(match.id, match);
      this.socketToMatch.set(opponent.socketId, match);
      this.socketToMatch.set(player.socketId, match);

      match.startCountdown();
      return { matched: true, match };
    }

    this.queue.push({
      ...player,
      queuedAt: Date.now()
    });

    return { matched: false };
  }

  public leaveQueue(socketId: string): boolean {
    const idx = this.queue.findIndex((e) => e.socketId === socketId);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
      return true;
    }
    return false;
  }

  public createRoom(
    hostPlayer: { playerId: string; nickname: string; language: string; socketId: string },
    customCode?: string
  ): { match: Match; roomCode: string } {
    const roomCode = (customCode || crypto.randomBytes(3).toString('hex')).toUpperCase();
    const matchId = `match_${crypto.randomBytes(4).toString('hex')}`;

    // Select questions supporting the host's language
    const normalizedLang = hostPlayer.language.toLowerCase().trim();
    const questions = selectMatchQuestions({
      languages: [normalizedLang],
      count: this.defaultConfig.questionCount
    });

    const match = new Match(matchId, questions, { ...this.defaultConfig }, roomCode);
    match.addListener({
      onFinished: (m) => persistMatch(m)
    });

    match.addPlayer(hostPlayer);

    this.matches.set(match.id, match);
    this.roomCodeToMatch.set(roomCode, match);
    this.socketToMatch.set(hostPlayer.socketId, match);

    return { match, roomCode };
  }

  public joinRoom(
    roomCode: string,
    player: { playerId: string; nickname: string; language: string; socketId: string }
  ): Match {
    const normalizedCode = roomCode.toUpperCase().trim();
    const match = this.roomCodeToMatch.get(normalizedCode);
    if (!match) {
      throw new Error(`Room code "${roomCode}" not found.`);
    }

    match.addPlayer(player);
    this.socketToMatch.set(player.socketId, match);

    return match;
  }

  public getMatchBySocket(socketId: string): Match | undefined {
    return this.socketToMatch.get(socketId);
  }

  public getMatchById(matchId: string): Match | undefined {
    return this.matches.get(matchId);
  }

  public getMatchByRoomCode(code: string): Match | undefined {
    return this.roomCodeToMatch.get(code.toUpperCase().trim());
  }

  public handleDisconnect(socketId: string): Match | undefined {
    this.leaveQueue(socketId);
    const match = this.socketToMatch.get(socketId);
    if (match) {
      match.handleDisconnect(socketId);
      this.socketToMatch.delete(socketId);
    }
    return match;
  }

  public bindSocketToMatch(socketId: string, match: Match): void {
    this.socketToMatch.set(socketId, match);
  }

  public handleReconnect(matchId: string, playerId: string, newSocketId: string): Match | null {
    const match = this.matches.get(matchId);
    if (!match) return null;

    const ok = match.handleReconnect(playerId, newSocketId);
    if (ok) {
      this.socketToMatch.set(newSocketId, match);
      return match;
    }
    return null;
  }
}

let managerInstance: MatchManager | null = null;

export function getMatchManager(): MatchManager {
  if (!managerInstance) {
    managerInstance = new MatchManager();
  }
  return managerInstance;
}
