import { Server, Socket } from 'socket.io';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getMatchManager } from '../match/MatchManager.js';
import { Match } from '../match/Match.js';
import { getCodeRunner } from '../runner/index.js';
import { getLanguageAdapter, MAX_CODE_BYTES } from '../runner/adapters.js';
import { loadAllQuestions } from '../match/questionSelector.js';

const JWT_SECRET = process.env.JWT_SECRET || 'skillsphere-coding-duel-secret-2026';
const REVEAL_SOLUTIONS = process.env.REVEAL_SOLUTIONS !== 'false';

// Zod schemas for event validation
const joinChallengeSchema = z.object({
  challengeId: z.string().trim().min(1).max(30),
  userDetails: z.object({
    name: z.string().optional()
  }).optional(),
  language: z.string().optional(),
  gameMode: z.string().optional(),
  playerId: z.string().optional(),
  questionCount: z.number().min(1).max(20).optional()
});

const codeSubmittedSchema = z.object({
  challengeId: z.string().trim().min(1).max(50),
  code: z.string().max(MAX_CODE_BYTES, 'Submitted code exceeds 20 KB limit'),
  language: z.string().trim().min(1),
  isSubmit: z.boolean(),
  submissionId: z.string().optional()
});

const queueJoinSchema = z.object({
  language: z.string().trim().min(1).optional()
});

const roomCreateSchema = z.object({
  language: z.string().trim().min(1).optional()
});

const roomJoinSchema = z.object({
  code: z.string().trim().min(1).max(30),
  language: z.string().trim().min(1).optional()
});

interface SocketAuthData {
  playerId: string;
  nickname: string;
}

function resolvePlayerAuth(socket: Socket): SocketAuthData {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token && typeof token === 'string') {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.playerId) {
        return {
          playerId: decoded.playerId,
          nickname: decoded.nickname || 'Player'
        };
      }
    } catch {
      // Invalid token, fall through to guest fallback
    }
  }

  // Direct player identifier from client auth/query
  const directPlayerId = socket.handshake.auth?.playerId || (socket.handshake.query?.playerId as string);
  const directNickname = socket.handshake.auth?.nickname || (socket.handshake.query?.nickname as string);
  if (directPlayerId && typeof directPlayerId === 'string' && directPlayerId.trim()) {
    return {
      playerId: directPlayerId.trim(),
      nickname: (directNickname && typeof directNickname === 'string') ? directNickname.trim() : 'Player'
    };
  }

  // Fallback guest identifier
  const guestId = `guest_${socket.id.substring(0, 6)}`;
  return {
    playerId: guestId,
    nickname: `Player_${socket.id.substring(0, 4)}`
  };
}

export function setupSocketGateway(io: Server): void {
  const manager = getMatchManager();
  const runner = getCodeRunner();

  // Helper to build native frontend state
  const buildNativeState = (match: Match) => {
    const roomKey = match.roomCode || match.id;
    const countdownSec = parseInt(process.env.COUNTDOWN_SEC || '10', 10);
    return {
      challengeId: roomKey,
      status: match.state === 'in_progress' ? 'started' : match.state,
      serverTime: Date.now(),
      countdownStartsAt: match.countdownStartsAt,
      countdownSec,
      players: [...match.players.values()].map((p) => ({
        socketId: p.socketId,
        userDetails: { name: p.nickname },
        score: p.score,
        currentIndex: p.currentIndex
      })),
      gameMode: match.gameMode || 'dsa_sprint',
      questions: match.getPublicQuestions()
    };
  };

  // Helper to broadcast match state in both native and normalized shapes
  const broadcastMatchState = (match: Match, targetSocket?: Socket) => {
    const roomKey = match.roomCode || match.id;
    const publicState = match.getPublicState();
    const nativeState = buildNativeState(match);

    // 1. Normalized broadcast
    io.to(roomKey).emit('match:state', publicState);

    // 2. Frontend Native format for Challenge.tsx
    const countdownSec = parseInt(process.env.COUNTDOWN_SEC || '10', 10);
    io.to(roomKey).emit('challenge_state', nativeState);

    // 3. If a target caller socket is provided, also send direct acknowledgment
    if (targetSocket) {
      targetSocket.emit('challenge_state', nativeState);
      if (match.state === 'in_progress') {
        targetSocket.emit('challenge_started', nativeState);
      }
    }

    if (match.state === 'countdown') {
      io.to(roomKey).emit('challenge_countdown', {
        startsAt: match.countdownStartsAt,
        duration: countdownSec
      });
      if (targetSocket) {
        targetSocket.emit('challenge_countdown', {
          startsAt: match.countdownStartsAt,
          duration: countdownSec
        });
      }
    }

    if (match.state === 'waiting' && match.players.size === 2) {
      io.to(roomKey).emit('challenge_ready');
      if (targetSocket) {
        targetSocket.emit('challenge_ready');
      }
    }

    if (match.state === 'in_progress') {
      io.to(roomKey).emit('challenge_started', nativeState);
    }

    if (match.state === 'finished') {
      const winnerPlayer = match.winnerId ? match.players.get(match.winnerId) : null;
      const winnerPayload = {
        winner: winnerPlayer
          ? {
              socketId: winnerPlayer.socketId,
              userDetails: { name: winnerPlayer.nickname },
              score: winnerPlayer.score
            }
          : { userDetails: { name: 'Draw' } }
      };

      io.to(roomKey).emit('challenge_end', winnerPayload);

      // Normalized match:end
      io.to(roomKey).emit('match:end', {
        winnerId: match.winnerId,
        reason: match.finishReason,
        scores: Object.fromEntries([...match.players.values()].map((p) => [p.playerId, p.score])),
        reveal: REVEAL_SOLUTIONS
          ? match.questions.map((q) => ({ id: q.id, pythonReference: q.pythonReference }))
          : undefined
      });
    }
  };

  io.on('connection', (socket: Socket) => {
    const auth = resolvePlayerAuth(socket);

    // =========================================================================
    // Native Protocol: join_challenge (Creates or joins room)
    // =========================================================================
    socket.on('join_challenge', async (rawPayload) => {
      try {
        const payload = joinChallengeSchema.parse(rawPayload);
        const code = payload.challengeId.toUpperCase().trim();
        const nickname = payload.userDetails?.name || auth.nickname;
        const rawLang = (payload.language || 'python').toLowerCase().trim();
        let language = 'python';
        if (rawLang === 'cpp' || rawLang === 'c' || rawLang === 'c++') {
          language = 'cpp';
        } else if (rawLang === 'javascript' || rawLang === 'js' || rawLang === 'node') {
          language = 'javascript';
        } else if (rawLang === 'java') {
          language = 'java';
        }
        const clientPlayerId = payload.playerId || auth.playerId;

        socket.join(code);

        let match = manager.getMatchByRoomCode(code);
        if (!match) {
          // Create room as host
          const created = manager.createRoom(
            {
              playerId: clientPlayerId,
              nickname,
              language,
              socketId: socket.id
            },
            code,
            payload.gameMode || 'dsa_sprint',
            payload.questionCount
          );
          match = created.match;
          match.addListener({
            onStateChange: (m) => broadcastMatchState(m)
          });
        } else {
          // Check if this player already belongs to the room by ID, socket, or nickname
          const normalizedNick = nickname.trim().toLowerCase();
          const existingPlayer =
            match.players.get(clientPlayerId) ||
            [...match.players.values()].find((p) => p.playerId === clientPlayerId) ||
            [...match.players.values()].find((p) => p.socketId === socket.id) ||
            [...match.players.values()].find((p) => p.nickname.trim().toLowerCase() === normalizedNick) ||
            [...match.players.values()].find((p) => clientPlayerId.includes(p.playerId) || p.playerId.includes(clientPlayerId));

          if (existingPlayer) {
            // Reconnect player to their active room session
            manager.handleReconnect(match.id, existingPlayer.playerId, socket.id);
            existingPlayer.nickname = nickname;
            existingPlayer.language = language;
          } else if (match.players.size < 2) {
            // Join as player 2
            manager.joinRoom(code, {
              playerId: clientPlayerId,
              nickname,
              language,
              socketId: socket.id
            });
            if (match.players.size === 2 && match.state === 'waiting') {
              match.startCountdown();
            }
          } else {
            // Fallback for reloaded clients where ID may have regenerated:
            // If one of the 2 players is disconnected, reconnect into that slot
            const disconnectedPlayer = [...match.players.values()].find((p) => !p.connected);
            if (disconnectedPlayer) {
              manager.handleReconnect(match.id, disconnectedPlayer.playerId, socket.id);
              disconnectedPlayer.nickname = nickname;
            } else {
              // Both marked connected: check if this socket was registered to a player
              const bySocket = [...match.players.values()].find((p) => p.socketId === socket.id);
              if (bySocket) {
                manager.handleReconnect(match.id, bySocket.playerId, socket.id);
              }
            }
          }
        }

        const roomKey = match.roomCode || match.id;
        socket.join(roomKey);

        // Always broadcast and guarantee direct delivery to this requesting socket
        broadcastMatchState(match, socket);
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // =========================================================================
    // Native Protocol: sync_arena (Immediate direct state synchronization)
    // =========================================================================
    socket.on('sync_arena', ({ challengeId }) => {
      const code = (challengeId || '').toUpperCase().trim();
      const match = manager.getMatchByRoomCode(code) || manager.getMatchBySocket(socket.id);
      if (match) {
        const roomKey = match.roomCode || match.id;
        socket.join(roomKey);

        // Check if player needs reconnect association
        const existingPlayer = [...match.players.values()].find((p) => p.socketId === socket.id) ||
          [...match.players.values()].find((p) => p.playerId === auth.playerId);
        if (existingPlayer) {
          manager.handleReconnect(match.id, existingPlayer.playerId, socket.id);
        }

        broadcastMatchState(match, socket);
      }
    });

    // =========================================================================
    // Native Protocol: start_challenge (Host starts countdown)
    // =========================================================================
    socket.on('start_challenge', ({ challengeId }) => {
      const match = manager.getMatchByRoomCode(challengeId) || manager.getMatchBySocket(socket.id);
      if (match && (match.state === 'waiting' || match.state === 'countdown')) {
        try {
          match.startCountdown();
          broadcastMatchState(match);
        } catch (err: any) {
          socket.emit('error', { message: err.message });
        }
      }
    });

    // =========================================================================
    // Native Protocol: code_submitted (Run Sample or Submit Solution)
    // =========================================================================
    socket.on('code_submitted', async (rawPayload) => {
      try {
        const payload = codeSubmittedSchema.parse(rawPayload);
        const match = manager.getMatchByRoomCode(payload.challengeId) || manager.getMatchBySocket(socket.id);

        if (!match) {
          socket.emit('code_result', {
            success: false,
            message: 'Match session not found. Please rejoin or create a new room.',
            isSubmit: payload.isSubmit
          });
          return;
        }

        if (match.state === 'finished') {
          socket.emit('code_result', {
            success: false,
            message: match.finishReason === 'forfeit'
              ? 'Match ended due to disconnect forfeit timeout.'
              : 'Match is already finished.',
            isSubmit: payload.isSubmit
          });
          broadcastMatchState(match);
          return;
        }

        if (match.state !== 'in_progress') {
          socket.emit('code_result', {
            success: false,
            message: `Match is currently in ${match.state} state (not in progress).`,
            isSubmit: payload.isSubmit
          });
          return;
        }

        let player = [...match.players.values()].find((p) => p.socketId === socket.id);
        if (!player) {
          player = match.players.get(auth.playerId) ||
            [...match.players.values()].find((p) => p.nickname === auth.nickname);
          if (player) {
            manager.handleReconnect(match.id, player.playerId, socket.id);
          }
        }

        if (!player) {
          socket.emit('code_result', {
            success: false,
            message: 'Player slot not found in this match.',
            isSubmit: payload.isSubmit
          });
          return;
        }

        // Broadcast to opponent that code is running
        const roomKey = match.roomCode || match.id;
        socket.to(roomKey).emit('opponent_running');

        const currentIndex = player.currentIndex || 0;
        const question = match.questions[currentIndex];
        if (!question) return;

        const langKey = payload.language.toLowerCase().trim();
        const adapter = getLanguageAdapter(langKey);
        const variant = question.variants[adapter.id];

        if (!variant) {
          socket.emit('code_result', {
            success: false,
            message: `Question does not support language ${adapter.displayName}`,
            isSubmit: payload.isSubmit
          });
          return;
        }

        const playerCodeLines = payload.code.split('\n').length;

        // --- CASE 1: Sample Test Execution (!isSubmit) ---
        if (!payload.isSubmit) {
          let sampleHarness = variant.harness;
          if (adapter.id === 'typescript') {
            sampleHarness = variant.harness;
          } else if (variant.example) {
            if (adapter.id === 'cpp') {
              const candidateMatch = variant.harness.match(/auto candidate\s*=\s*[^;]+;/);
              const candidateLine = candidateMatch ? candidateMatch[0] : '';
              sampleHarness = `\nint main() {\n    ${candidateLine}\n    ${variant.example}\n    return 0;\n}\n`;
            } else if (adapter.id === 'javascript' && variant.harness.includes('expect(')) {
              sampleHarness = variant.harness;
            } else {
              sampleHarness = `\n\n${variant.example}\n`;
            }
          }

          const sampleVariant = {
            starterCode: variant.starterCode,
            harness: sampleHarness,
            example: variant.example
          };

          const fullProgram = adapter.buildProgram(payload.code, sampleVariant);
          const result = await runner.run({
            language: adapter.id,
            source: fullProgram,
            playerCodeLines
          });

          const isSuccess = result.verdict === 'passed';
          socket.emit('code_result', {
            success: isSuccess,
            message: isSuccess
              ? 'Sample assertion passed! Click SUBMIT SOLUTION to evaluate all test cases.'
              : result.publicMessage || 'Sample assertion failed.',
            isSubmit: false,
            executionTimeMs: result.timeMs
          });
          return;
        }

        // --- CASE 2: Official Submission (isSubmit) ---
        const subId = payload.submissionId || `sub_${crypto.randomBytes(4).toString('hex')}`;
        
        let subRecord;
        try {
          subRecord = match.registerSubmission(player.playerId, question.id, payload.code, subId);
        } catch (rateErr: any) {
          socket.emit('code_result', {
            success: false,
            message: rateErr.message,
            isSubmit: true
          });
          return;
        }

        // Build full program with hidden test harness
        const fullProgram = adapter.buildProgram(payload.code, variant);

        const result = await runner.run({
          language: adapter.id,
          source: fullProgram,
          playerCodeLines
        });

        // Update match engine
        match.handleSubmissionResult(subRecord.id, result);

        const isSuccess = result.verdict === 'passed';

        socket.emit('code_result', {
          success: isSuccess,
          message: isSuccess ? 'Correct! All test cases passed.' : result.publicMessage,
          isSubmit: true,
          executionTimeMs: result.timeMs
        });

        // Broadcast progress to opponent
        socket.to(roomKey).emit('opponent:progress', {
          solvedCount: player.solvedQuestionIds.size,
          solvedQuestionIds: [...player.solvedQuestionIds]
        });

        broadcastMatchState(match);
      } catch (err: any) {
        socket.emit('code_result', {
          success: false,
          message: err.message || 'Execution failed',
          isSubmit: rawPayload?.isSubmit ?? true
        });
      }
    });

    // =========================================================================
    // Native Protocol: skip_question
    // =========================================================================
    socket.on('skip_question', ({ challengeId }) => {
      const match = manager.getMatchByRoomCode(challengeId) || manager.getMatchBySocket(socket.id);
      if (match) {
        const player = [...match.players.values()].find((p) => p.socketId === socket.id);
        if (player) {
          match.skipQuestion(player.playerId);
          broadcastMatchState(match);
        }
      }
    });

    // =========================================================================
    // Native Protocol: surrender
    // =========================================================================
    socket.on('surrender', ({ challengeId }) => {
      const match = manager.getMatchByRoomCode(challengeId) || manager.getMatchBySocket(socket.id);
      if (match) {
        const player = [...match.players.values()].find((p) => p.socketId === socket.id);
        if (player) {
          match.surrender(player.playerId);
          broadcastMatchState(match);
        }
      }
    });

    // =========================================================================
    // Native Protocol: typing
    // =========================================================================
    socket.on('typing', ({ challengeId }) => {
      const match = manager.getMatchByRoomCode(challengeId) || manager.getMatchBySocket(socket.id);
      if (match) {
        const roomKey = match.roomCode || match.id;
        socket.to(roomKey).emit('opponent_typing');
      }
    });

    // =========================================================================
    // Native Protocol: leave_challenge
    // =========================================================================
    socket.on('leave_challenge', ({ challengeId }) => {
      const match = manager.getMatchByRoomCode(challengeId) || manager.getMatchBySocket(socket.id);
      if (match) {
        const roomKey = match.roomCode || match.id;
        socket.leave(roomKey);
        manager.handleDisconnect(socket.id);
        broadcastMatchState(match);
      }
    });

    // =========================================================================
    // Normalized Protocol: Quick Match Queue
    // =========================================================================
    socket.on('queue:join', (rawPayload) => {
      try {
        const payload = queueJoinSchema.parse(rawPayload || {});
        const language = payload.language || 'python';

        const { matched, match } = manager.joinQueue({
          playerId: auth.playerId,
          nickname: auth.nickname,
          language,
          socketId: socket.id
        });

        if (matched && match) {
          const roomKey = match.roomCode || match.id;
          socket.join(roomKey);
          match.addListener({
            onStateChange: (m) => broadcastMatchState(m)
          });
          broadcastMatchState(match);
        } else {
          socket.emit('queue:waiting');
        }
      } catch (err: any) {
        socket.emit('error', { code: 'QUEUE_ERROR', message: err.message });
      }
    });

    socket.on('queue:leave', () => {
      manager.leaveQueue(socket.id);
    });

    // =========================================================================
    // Sandbox Run Protocol (Live Testing in Sandbox Area)
    // =========================================================================
    socket.on('sandbox:run', async (payload: { code: string; language: string; questionId?: string }) => {
      try {
        const allQuestions = loadAllQuestions();
        const q = allQuestions.find((item) => item.id === payload.questionId) || allQuestions[0];
        if (!q) {
          socket.emit('sandbox:result', {
            success: false,
            message: 'Question not found in question bank.'
          });
          return;
        }

        const adapter = getLanguageAdapter(payload.language || 'python');
        const variant = q.variants[adapter.id];
        if (!variant) {
          socket.emit('sandbox:result', {
            success: false,
            message: `Question does not support language ${adapter.displayName}`
          });
          return;
        }

        let sampleHarness = variant.harness;
        if (variant.example) {
          if (adapter.id === 'cpp') {
            const candidateMatch = variant.harness.match(/auto candidate\s*=\s*[^;]+;/);
            const candidateLine = candidateMatch ? candidateMatch[0] : '';
            sampleHarness = `\nint main() {\n    ${candidateLine}\n    ${variant.example}\n    return 0;\n}\n`;
          } else {
            sampleHarness = `\n\n${variant.example}\n`;
          }
        }

        const fullProgram = adapter.buildProgram(payload.code, {
          starterCode: variant.starterCode,
          harness: sampleHarness,
          example: variant.example
        });

        const playerCodeLines = payload.code.split('\n').length;
        const result = await runner.run({
          language: adapter.id,
          source: fullProgram,
          playerCodeLines
        });

        const isSuccess = result.verdict === 'passed';
        socket.emit('sandbox:result', {
          success: isSuccess,
          message: isSuccess
            ? 'Sample assertion passed! All sample test cases passed.'
            : result.publicMessage || 'Sample assertion failed.',
          executionTimeMs: result.timeMs
        });
      } catch (err: any) {
        socket.emit('sandbox:result', {
          success: false,
          message: err.message || 'Sandbox execution error'
        });
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      const match = manager.handleDisconnect(socket.id);
      if (match) {
        broadcastMatchState(match);
      }
    });
  });
}
