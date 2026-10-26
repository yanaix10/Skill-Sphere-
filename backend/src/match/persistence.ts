import ChallengeSession from '../models/ChallengeSession.js';
import { Match } from './Match.js';

export async function markUnfinishedMatchesAsAbandoned(): Promise<void> {
  try {
    const res = await ChallengeSession.updateMany(
      { status: { $in: ['waiting', 'ready', 'started'] } },
      { $set: { status: 'completed', winner: { name: 'Match Abandoned (Server Restart)' } } }
    );
    if (res.modifiedCount > 0) {
      console.log(`[Persistence] Marked ${res.modifiedCount} unfinished matches as abandoned on server start.`);
    }
  } catch (err: any) {
    // MongoDB might be in-memory or not connected yet; log gracefully
    console.warn('[Persistence] Notice: Could not update abandoned matches in DB (in-memory or DB connecting):', err.message);
  }
}

export async function persistMatch(match: Match): Promise<void> {
  try {
    const playersData = [...match.players.values()].map((p) => ({
      socketId: p.socketId,
      userDetails: {
        name: p.nickname,
        playerId: p.playerId,
        language: p.language
      },
      score: p.score,
      currentIndex: p.currentIndex
    }));

    const winnerPlayer = match.winnerId ? match.players.get(match.winnerId) : null;
    const winnerData = winnerPlayer
      ? { name: winnerPlayer.nickname, playerId: winnerPlayer.playerId, score: winnerPlayer.score }
      : match.finishReason === 'time_cap'
      ? { name: 'Draw (Time Cap Reached)' }
      : { name: 'Draw' };

    await ChallengeSession.findOneAndUpdate(
      { challengeId: match.roomCode || match.id },
      {
        $set: {
          challengeId: match.roomCode || match.id,
          players: playersData,
          status: 'completed',
          winner: winnerData,
          questions: match.getPublicQuestions()
        }
      },
      { upsert: true, new: true }
    );

    console.log(`[Persistence] Match ${match.id} (Room ${match.roomCode || 'N/A'}) persisted to database.`);
  } catch (err: any) {
    console.warn(`[Persistence] Could not persist match ${match.id} to MongoDB:`, err.message);
  }
}
