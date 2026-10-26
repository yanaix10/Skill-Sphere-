import { Verdict } from '../runner/types.js';

export type MatchState = 'waiting' | 'countdown' | 'in_progress' | 'finished';

export type FinishReason = 'completed' | 'time_cap' | 'forfeit' | 'abandoned';

export interface PublicQuestionVariant {
  starterCode: string;
  example: string;
}

export interface MatchQuestion {
  id: string;
  title: string;
  statement: string;
  tags: string[];
  refLines: number;
  estMinutes: number;
  enabled: boolean;
  flagReason?: string | null;
  pythonReference?: string;
  variants: {
    [language: string]: {
      starterCode: string;
      harness: string;
      example: string;
    };
  };
}

export interface PublicMatchQuestion {
  id: string;
  title: string;
  statement: string;
  category?: string;
  difficulty?: string;
  tags: string[];
  estMinutes: number;
  languages: {
    [language: string]: PublicQuestionVariant;
  };
}

export interface PlayerRecord {
  playerId: string;
  nickname: string;
  language: string;
  socketId: string;
  connected: boolean;
  disconnectedAt?: number;
  score: number;
  currentIndex: number;
  solvedQuestionIds: Set<string>;
  firstPassTimeMs: Map<string, number>; // questionId -> ms since match start
  submissionsCount: Map<string, number>; // questionId -> count
  lastSubmissionTime: number; // timestamp
}

export interface SubmissionRecord {
  id: string;
  matchId: string;
  playerId: string;
  questionId: string;
  language: string;
  code: string;
  receivedAt: number; // server timestamp
  evaluatedAt?: number;
  verdict?: Verdict;
  publicMessage?: string;
  timeMs?: number;
  isEvaluating?: boolean;
}

export interface MatchConfig {
  questionCount: number;
  timeCapSec: number;
  reconnectGraceSec: number;
  scoringMode: 'sprint' | 'race';
  matchSameLanguage: boolean;
}

export interface WinnerCheckResult {
  finished: boolean;
  winnerId: string | null;
  reason?: FinishReason;
}
