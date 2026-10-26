import { MatchQuestion, PlayerRecord, SubmissionRecord, WinnerCheckResult } from './types.js';

export interface MatchContext {
  id: string;
  startedAt: number;
  timeCapAt: number;
  questions: MatchQuestion[];
  players: Map<string, PlayerRecord>;
  pendingSubmissions: Map<string, SubmissionRecord>;
  setPendingWinnerCheck(candidateId: string, timeoutMs: number): void;
}

export interface ScoringMode {
  name: 'sprint' | 'race';
  onSubmissionResult(
    ctx: MatchContext,
    player: PlayerRecord,
    questionId: string,
    submission: SubmissionRecord,
    isPass: boolean
  ): WinnerCheckResult;
  checkTimeCap(ctx: MatchContext): WinnerCheckResult;
}

export class SprintScoringMode implements ScoringMode {
  name: 'sprint' = 'sprint';

  onSubmissionResult(
    ctx: MatchContext,
    player: PlayerRecord,
    questionId: string,
    submission: SubmissionRecord,
    isPass: boolean
  ): WinnerCheckResult {
    if (!isPass) {
      return { finished: false, winnerId: null };
    }

    // Record solved state
    if (!player.solvedQuestionIds.has(questionId)) {
      player.solvedQuestionIds.add(questionId);
      player.score = player.solvedQuestionIds.size;
      player.currentIndex = Math.min(player.currentIndex + 1, ctx.questions.length);
      const elapsed = Math.max(0, submission.receivedAt - ctx.startedAt);
      player.firstPassTimeMs.set(questionId, elapsed);
    }

    // Check if player solved all questions
    if (player.score >= ctx.questions.length) {
      // FAIRNESS RULE:
      // If opponent has an earlier submission still evaluating in Judge0, wait for it (max 10s)
      const opponent = [...ctx.players.values()].find((p) => p.playerId !== player.playerId);
      if (opponent) {
        const hasEarlierEvaluatingSubmission = [...ctx.pendingSubmissions.values()].some(
          (sub) => sub.playerId === opponent.playerId && sub.isEvaluating && sub.receivedAt < submission.receivedAt
        );

        if (hasEarlierEvaluatingSubmission) {
          ctx.setPendingWinnerCheck(player.playerId, 10000);
          return { finished: false, winnerId: null };
        }
      }

      return {
        finished: true,
        winnerId: player.playerId,
        reason: 'completed'
      };
    }

    return { finished: false, winnerId: null };
  }

  checkTimeCap(ctx: MatchContext): WinnerCheckResult {
    const playersList = [...ctx.players.values()];
    if (playersList.length < 2) {
      return {
        finished: true,
        winnerId: playersList[0]?.playerId || null,
        reason: 'time_cap'
      };
    }

    const [p1, p2] = playersList;

    // 1. More solved questions wins
    if (p1.score > p2.score) {
      return { finished: true, winnerId: p1.playerId, reason: 'time_cap' };
    }
    if (p2.score > p1.score) {
      return { finished: true, winnerId: p2.playerId, reason: 'time_cap' };
    }

    // 2. Tie-break: lower total solve time
    const sumTime = (p: PlayerRecord) =>
      [...p.firstPassTimeMs.values()].reduce((acc, curr) => acc + curr, 0);

    const t1 = sumTime(p1);
    const t2 = sumTime(p2);

    if (t1 < t2) {
      return { finished: true, winnerId: p1.playerId, reason: 'time_cap' };
    }
    if (t2 < t1) {
      return { finished: true, winnerId: p2.playerId, reason: 'time_cap' };
    }

    // 3. True draw
    return { finished: true, winnerId: null, reason: 'time_cap' };
  }
}

export class RaceScoringMode implements ScoringMode {
  name: 'race' = 'race';

  onSubmissionResult(
    ctx: MatchContext,
    player: PlayerRecord,
    questionId: string,
    submission: SubmissionRecord,
    isPass: boolean
  ): WinnerCheckResult {
    if (!isPass) return { finished: false, winnerId: null };

    // In race mode, first to pass gets the point and both move on
    if (!player.solvedQuestionIds.has(questionId)) {
      player.solvedQuestionIds.add(questionId);
      player.score += 1;
      player.firstPassTimeMs.set(questionId, submission.receivedAt - ctx.startedAt);

      // Advance both players to next question index
      for (const p of ctx.players.values()) {
        p.currentIndex += 1;
      }
    }

    // If reached end of question list
    if (player.currentIndex >= ctx.questions.length) {
      return this.checkTimeCap(ctx);
    }

    return { finished: false, winnerId: null };
  }

  checkTimeCap(ctx: MatchContext): WinnerCheckResult {
    const [p1, p2] = [...ctx.players.values()];
    if (!p1 || !p2) return { finished: true, winnerId: p1?.playerId || null, reason: 'time_cap' };

    if (p1.score > p2.score) return { finished: true, winnerId: p1.playerId, reason: 'time_cap' };
    if (p2.score > p1.score) return { finished: true, winnerId: p2.playerId, reason: 'time_cap' };
    return { finished: true, winnerId: null, reason: 'time_cap' };
  }
}

export function getScoringMode(mode: 'sprint' | 'race'): ScoringMode {
  return mode === 'race' ? new RaceScoringMode() : new SprintScoringMode();
}
