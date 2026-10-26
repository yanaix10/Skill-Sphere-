import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { io as ClientSocket } from 'socket.io-client';
import { setupSocketGateway } from '../gateway/socketGateway.js';

async function runDemoMatch() {
  process.env.RUNNER = 'mock';
  process.env.MATCH_QUESTION_COUNT = '3';

  console.log('⚔️  Starting Coding Duel Live Demo Match between Bots...\n');

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  setupSocketGateway(io);

  const port = await new Promise<number>((resolve) => {
    server.listen(0, () => {
      const addr = server.address() as any;
      resolve(addr.port);
    });
  });

  const url = `http://localhost:${port}`;
  const roomCode = 'BOTDUEL';

  const bot1 = ClientSocket(url);
  const bot2 = ClientSocket(url);

  await Promise.all([
    new Promise((r) => bot1.on('connect', () => r(null))),
    new Promise((r) => bot2.on('connect', () => r(null)))
  ]);

  console.log('🤖 Connected BotAlice & BotBob to server.');

  bot1.emit('join_challenge', {
    challengeId: roomCode,
    userDetails: { name: 'BotAlice' },
    language: 'python'
  });

  await new Promise((r) => setTimeout(r, 400));

  bot2.emit('join_challenge', {
    challengeId: roomCode,
    userDetails: { name: 'BotBob' },
    language: 'cpp'
  });

  await new Promise<void>((resolve) => {
    bot1.on('challenge_ready', () => {
      console.log('✅ Both bots in arena. Room is READY.');
      resolve();
    });
  });

  bot1.emit('start_challenge', { challengeId: roomCode });
  console.log('🚀 Match started! Countdown initialized.\n');

  const questions: any[] = await new Promise((resolve) => {
    bot1.on('challenge_started', (state) => {
      resolve(state.questions);
    });
  });

  console.log(`📋 Received ${questions.length} problems for this duel:`);
  questions.forEach((q, idx) => {
    console.log(`   ${idx + 1}. [${q.difficulty}] ${q.title} (${q.category})`);
  });
  console.log('');

  let aliceScore = 0;
  let bobScore = 0;

  bot1.on('code_result', (res) => {
    if (res.success && res.isSubmit) {
      aliceScore++;
      console.log(`✨ [BotAlice] Solved Question! Score: ${aliceScore}/${questions.length}`);
    }
  });

  bot2.on('code_result', (res) => {
    if (res.success && res.isSubmit) {
      bobScore++;
      console.log(`⚡ [BotBob] Solved Question! Score: ${bobScore}/${questions.length}`);
    }
  });

  bot1.on('opponent_running', () => console.log('   👀 BotAlice observes BotBob running code...'));
  bot2.on('opponent_running', () => console.log('   👀 BotBob observes BotAlice running code...'));

  // Bot duel simulation loop
  const matchFinished = new Promise<void>((resolve) => {
    bot1.on('challenge_end', ({ winner }) => {
      console.log('\n🏆 ==============================================');
      console.log(`   DUEL COMPLETE! Winner: ${winner?.userDetails?.name || 'Draw'}`);
      console.log('==============================================\n');
      resolve();
    });
  });

  // BotAlice attempts questions every 2.2 seconds
  (async () => {
    for (let i = 0; i < questions.length; i++) {
      await new Promise((r) => setTimeout(r, 2200));
      bot1.emit('typing', { challengeId: roomCode });
      await new Promise((r) => setTimeout(r, 500));
      bot1.emit('code_submitted', {
        challengeId: roomCode,
        code: `def solve_${i}():\n    # PASS_ME\n    return True`,
        language: 'python',
        isSubmit: true
      });
    }
  })();

  // BotBob attempts with slightly longer delay
  (async () => {
    for (let i = 0; i < questions.length; i++) {
      await new Promise((r) => setTimeout(r, 3400));
      bot2.emit('typing', { challengeId: roomCode });
      await new Promise((r) => setTimeout(r, 600));
      bot2.emit('code_submitted', {
        challengeId: roomCode,
        code: `int solve_${i}() {\n    // PASS_ME\n    return 1;\n}`,
        language: 'cpp',
        isSubmit: true
      });
    }
  })();

  await matchFinished;

  bot1.disconnect();
  bot2.disconnect();
  io.close();
  server.close();
  process.exit(0);
}

runDemoMatch().catch((err) => {
  console.error('Demo match error:', err);
  process.exit(1);
});
