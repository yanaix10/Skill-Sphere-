import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { setupSocketGateway } from '../src/gateway/socketGateway.js';

describe('Coding Duel Socket Integration Test', () => {
  let server: http.Server;
  let io: Server;
  let port: number;
  let client1: ClientSocketType;
  let client2: ClientSocketType;

  beforeAll(async () => {
    process.env.RUNNER = 'mock';
    process.env.MATCH_QUESTION_COUNT = '2'; // Fast 2-question test match

    const app = express();
    server = http.createServer(app);
    io = new Server(server, { cors: { origin: '*' } });
    setupSocketGateway(io);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address() as any;
        port = addr.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (client1?.connected) client1.disconnect();
    if (client2?.connected) client2.disconnect();
    io.close();
    server.close();
  });

  it('runs a complete 2-player match with MockRunner to completion', async () => {
    const roomCode = 'TEST99';

    // 1. Client 1 (Host) joins room
    client1 = ClientSocket(`http://localhost:${port}`);
    await new Promise<void>((resolve) => client1.on('connect', resolve));

    client1.emit('join_challenge', {
      challengeId: roomCode,
      userDetails: { name: 'Alice' },
      language: 'python'
    });

    const hostState: any = await new Promise((resolve) => {
      client1.on('challenge_state', (state) => {
        if (state.players.length === 1) resolve(state);
      });
    });
    expect(hostState.players[0].userDetails.name).toBe('Alice');

    // 2. Client 2 (Opponent) joins room
    client2 = ClientSocket(`http://localhost:${port}`);
    await new Promise<void>((resolve) => client2.on('connect', resolve));

    const readyPromise = new Promise<void>((resolve) => client1.on('challenge_ready', resolve));

    client2.emit('join_challenge', {
      challengeId: roomCode,
      userDetails: { name: 'Bob' },
      language: 'cpp'
    });

    await readyPromise;

    // 3. Host starts challenge
    const startedPromise = new Promise<any>((resolve) => client1.on('challenge_started', resolve));
    client1.emit('start_challenge', { challengeId: roomCode });
    const startedState = await startedPromise;

    expect(startedState.questions.length).toBe(2);
    // Security check: verify no hidden test harness or reference solution is in startedState
    for (const q of startedState.questions) {
      expect(q).not.toHaveProperty('harness');
      expect(q).not.toHaveProperty('pythonReference');
      expect(q.languages.python).not.toHaveProperty('harness');
      expect(q.languages.cpp).not.toHaveProperty('harness');
    }

    // 4. Alice submits passing code for Q1
    const resultPromise = new Promise<any>((resolve) => client1.on('code_result', resolve));
    client1.emit('code_submitted', {
      challengeId: roomCode,
      code: 'def solve():\n    # PASS_ME\n    return True',
      language: 'python',
      isSubmit: true
    });
    const subResult1 = await resultPromise;
    expect(subResult1.success).toBe(true);

    // Wait 2100ms to satisfy per-player 2-second rate limit
    await new Promise((resolve) => setTimeout(resolve, 2100));

    // 5. Alice submits passing code for Q2 and wins
    const endPromise = new Promise<any>((resolve) => client1.on('challenge_end', resolve));
    client1.emit('code_submitted', {
      challengeId: roomCode,
      code: 'def solve2():\n    # PASS_ME\n    return True',
      language: 'python',
      isSubmit: true
    });

    const matchEnd = await endPromise;
    expect(matchEnd.winner.userDetails.name).toBe('Alice');
  }, 20000);
});
