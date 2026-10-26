import { describe, it, expect } from 'vitest';
import { Match } from '../src/match/Match.js';
import { selectMatchQuestions } from '../src/match/questionSelector.js';
import { MatchQuestion } from '../src/match/types.js';

function createMockQuestions(count: number): MatchQuestion[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `q_${i + 1}`,
    title: `Question ${i + 1}`,
    statement: `Solve problem ${i + 1}`,
    tags: [i % 2 === 0 ? 'math' : 'string'],
    refLines: 3,
    estMinutes: i < 2 ? 2 : i < 7 ? 3 : 4,
    enabled: true,
    variants: {
      python: { starterCode: 'def solve(): pass', harness: 'assert True', example: 'assert True' },
      cpp: { starterCode: 'int solve() {}', harness: 'int main() {}', example: 'assert(true);' }
    }
  }));
}

describe('Match Engine & Rules', () => {
  it('selects questions with progressive difficulty ramp and language support', () => {
    const all = createMockQuestions(20);
    const selected = selectMatchQuestions({
      languages: ['python', 'cpp'],
      count: 8,
      allQuestions: all
    });

    expect(selected.length).toBe(8);
    // Verified difficulty ramp (estMinutes monotonically non-decreasing or smoothed)
    expect(selected[0].estMinutes).toBeLessThanOrEqual(selected[selected.length - 1].estMinutes);
  });

  it('declares sprint winner when first player solves all questions', () => {
    const questions = createMockQuestions(3);
    const match = new Match('test_match', questions, {
      questionCount: 3,
      timeCapSec: 60,
      reconnectGraceSec: 30,
      scoringMode: 'sprint',
      matchSameLanguage: false
    });

    match.addPlayer({ playerId: 'p1', nickname: 'Alice', language: 'python', socketId: 'sock1' });
    match.addPlayer({ playerId: 'p2', nickname: 'Bob', language: 'cpp', socketId: 'sock2' });
    match.startMatch();

    // Alice solves Q1, Q2, Q3
    for (const q of questions) {
      const sub = match.registerSubmission('p1', q.id, 'code', `sub_${q.id}`, true);
      match.handleSubmissionResult(sub.id, { verdict: 'passed', publicMessage: 'Passed' });
    }

    expect(match.state).toBe('finished');
    expect(match.winnerId).toBe('p1');
    expect(match.finishReason).toBe('completed');
  });

  it('breaks time-cap ties using lower total solve time', () => {
    const questions = createMockQuestions(3);
    const match = new Match('test_match', questions, {
      questionCount: 3,
      timeCapSec: 10,
      reconnectGraceSec: 30,
      scoringMode: 'sprint',
      matchSameLanguage: false
    });

    match.addPlayer({ playerId: 'p1', nickname: 'Alice', language: 'python', socketId: 'sock1' });
    match.addPlayer({ playerId: 'p2', nickname: 'Bob', language: 'cpp', socketId: 'sock2' });
    match.startMatch();

    // Both solve 1 question, but Alice solves it faster
    const aliceSub = match.registerSubmission('p1', 'q_1', 'code', 'sub_a');
    aliceSub.receivedAt = match.startedAt + 5000;
    match.handleSubmissionResult(aliceSub.id, { verdict: 'passed', publicMessage: 'Passed' });

    const bobSub = match.registerSubmission('p2', 'q_1', 'code', 'sub_b');
    bobSub.receivedAt = match.startedAt + 9000;
    match.handleSubmissionResult(bobSub.id, { verdict: 'passed', publicMessage: 'Passed' });

    // Simulate time cap reached
    match.timeCapAt = Date.now() - 1000;
    match.tick();

    expect(match.state).toBe('finished');
    expect(match.finishReason).toBe('time_cap');
    expect(match.winnerId).toBe('p1'); // Alice had lower total solve time
  });

  it('forfeits match if a disconnected player does not return within grace period', () => {
    const questions = createMockQuestions(3);
    const match = new Match('test_match', questions, {
      questionCount: 3,
      timeCapSec: 60,
      reconnectGraceSec: 2, // 2s grace for test
      scoringMode: 'sprint',
      matchSameLanguage: false
    });

    match.addPlayer({ playerId: 'p1', nickname: 'Alice', language: 'python', socketId: 'sock1' });
    match.addPlayer({ playerId: 'p2', nickname: 'Bob', language: 'cpp', socketId: 'sock2' });
    match.startMatch();

    // Bob disconnects
    match.handleDisconnect('sock2');
    const bob = match.players.get('p2')!;
    expect(bob.connected).toBe(false);

    // Advance time past grace period
    bob.disconnectedAt = Date.now() - 3000;
    match.tick();

    expect(match.state).toBe('finished');
    expect(match.finishReason).toBe('forfeit');
    expect(match.winnerId).toBe('p1');
  });

  it('delays winner declaration if opponent has an earlier submission still evaluating', () => {
    const questions = createMockQuestions(2);
    const match = new Match('test_match', questions, {
      questionCount: 2,
      timeCapSec: 60,
      reconnectGraceSec: 30,
      scoringMode: 'sprint',
      matchSameLanguage: false
    });

    match.addPlayer({ playerId: 'p1', nickname: 'Alice', language: 'python', socketId: 'sock1' });
    match.addPlayer({ playerId: 'p2', nickname: 'Bob', language: 'cpp', socketId: 'sock2' });
    match.startMatch();

    // Alice already solved Q1
    const subA1 = match.registerSubmission('p1', 'q_1', 'code', 'sub_a1');
    match.handleSubmissionResult(subA1.id, { verdict: 'passed', publicMessage: 'Passed' });

    // Bob submits Q1 at timestamp 100 (still evaluating)
    const bobSub = match.registerSubmission('p2', 'q_1', 'code', 'sub_b1');
    bobSub.receivedAt = match.startedAt + 100;

    // Alice submits Q2 at timestamp 200 and passes
    const subA2 = match.registerSubmission('p1', 'q_2', 'code', 'sub_a2', true);
    subA2.receivedAt = match.startedAt + 200;

    const check = match.handleSubmissionResult(subA2.id, { verdict: 'passed', publicMessage: 'Passed' });

    // Fairness check: since Bob has an earlier evaluating submission, Alice should not win immediately
    expect(check.finished).toBe(false);
    expect(match.state).toBe('in_progress');
    expect(match.pendingWinnerCheck?.candidateId).toBe('p1');
  });
});
