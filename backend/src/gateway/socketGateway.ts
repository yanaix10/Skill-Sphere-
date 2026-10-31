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
  playerId: z.string().optional()
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

  // Helper to broadcast match state in both native and normalized shapes
  const broadcastMatchState = (match: Match) => {
    const roomKey = match.roomCode || match.id;
    const publicState = match.getPublicState();

    // 1. Normalized broadcast
    io.to(roomKey).emit('match:state', publicState);

    // 2. Frontend Native format for Challenge.tsx
    const countdownSec = parseInt(process.env.COUNTDOWN_SEC || '60', 10);
    const nativeState = {
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

    io.to(roomKey).emit('challenge_state', nativeState);

    if (match.state === 'countdown') {
      io.to(roomKey).emit('challenge_countdown', {
        startsAt: match.countdownStartsAt,
        duration: countdownSec
      });
    }

    if (match.state === 'waiting' && match.players.size === 2) {
      io.to(roomKey).emit('challenge_ready');
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
            payload.gameMode || 'dsa_sprint'
          );
          match = created.match;
          match.addListener({
            onStateChange: (m) => broadcastMatchState(m)
          });
        } else {
          // Check if this socket or playerId is already recognized in the room
          const existingBySocket = [...match.players.values()].find((p) => p.socketId === socket.id);
          const existingById = match.players.get(clientPlayerId);

          if (match.state === 'waiting' && match.players.size < 2) {
            if (existingBySocket) {
              // Same socket re-sending join, update metadata
              existingBySocket.nickname = nickname;
              existingBySocket.language = language;
            } else if (existingById && !existingById.connected) {
              // Disconnected player reconnecting
              manager.handleReconnect(match.id, existingById.playerId, socket.id);
            } else if (existingById && existingById.connected) {
              // Collision: client has same ID while existing player is actively connected (e.g. 2 tabs in same browser session)
              // Generate unique player ID so 2nd player joins properly as Player 2
              const uniquePlayerId = `${clientPlayerId}_${socket.id.substring(0, 6)}`;
              manager.joinRoom(code, {
                playerId: uniquePlayerId,
                nickname,
                language,
                socketId: socket.id
              });
            } else {
              // Brand new 2nd player
              manager.joinRoom(code, {
                playerId: clientPlayerId,
                nickname,
                language,
                socketId: socket.id
              });
            }

            if (match.state === 'waiting' && match.players.size === 2) {
              match.startCountdown();
            }
          } else {
            // Room is full or match is countdown / in_progress / finished
            if (existingBySocket) {
              // Already connected
            } else if (existingById) {
              manager.handleReconnect(match.id, existingById.playerId, socket.id);
            } else {
              socket.emit('error', { message: 'Room is already full or match in progress.' });
              return;
            }
          }
        }

        broadcastMatchState(match);
      } catch (err: any) {
        socket.emit('error', { message: err.message });
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
