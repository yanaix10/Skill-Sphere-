import "dotenv/config";
import express from "express";
import cors from "cors";
import admin from "./config/firebase-config.js";
import http from "http";
import { Server, Socket } from "socket.io";
import ChallengeSession from "./models/ChallengeSession.js";

import { connectDB } from "./config/db.js";
import questionRoutes from "./routes/questionRoutes.js";
import challengeRoutes from './routes/challengeRoutes.js';
import duelRoutes from './routes/duelRoutes.js';
import googleRoutes from './routes/googleRoutes.js';
import { setupSocketGateway } from './gateway/socketGateway.js';
import { markUnfinishedMatchesAsAbandoned } from './match/persistence.js';
import { getMatchManager } from './match/MatchManager.js';
import { sanitizeQuestionForClient } from './match/questionSelector.js';

// Normalize origin: strip trailing slash, support comma-separated list and wildcards
const rawOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
const allowedOrigins = rawOrigin
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

// CORS handler that echoes back the requesting origin safely
const corsOriginHandler = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Allow requests with no origin (e.g. server-to-server, curl)
  if (!origin) return callback(null, true);
  const normalized = origin.replace(/\/$/, '');
  if (
    allowedOrigins.some((o) => o.toLowerCase() === normalized.toLowerCase()) ||
    normalized.endsWith('.vercel.app') ||
    normalized.includes('localhost') ||
    normalized.includes('127.0.0.1')
  ) {
    return callback(null, true);
  }
  // Safe fallback: allow origin so frontend is never blocked
  return callback(null, true);
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 60000,
});

connectDB();
markUnfinishedMatchesAsAbandoned();

app.use(cors({
    origin: corsOriginHandler,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json());

app.use('/api', duelRoutes);
app.use('/api/duel', duelRoutes);
app.use('/api/quiz', questionRoutes);
app.use('/api/challenge', challengeRoutes);
app.use('/api/google', googleRoutes);

app.get("/", (req, res) => {
  res.send("Server working");
});

/**
 * GET /api/match/:roomCode
 * Returns live match state including sanitized questions for the given room.
 * Used as an HTTP fallback when Socket.io events are missed by the client.
 */
app.get("/api/match/:roomCode", (req, res): any => {
  const code = (req.params.roomCode || '').toUpperCase().trim();
  if (!code) return res.status(400).json({ success: false, message: 'Missing room code' });

  const manager = getMatchManager();
  const match = manager.getMatchByRoomCode(code);
  if (!match) {
    return res.status(404).json({ success: false, message: 'Match not found or expired' });
  }

  const countdownSec = parseInt(process.env.COUNTDOWN_SEC || '10', 10);
  return res.json({
    success: true,
    challengeId: match.roomCode || match.id,
    status: match.state === 'in_progress' ? 'started' : match.state,
    gameMode: match.gameMode || 'dsa_sprint',
    countdownStartsAt: match.countdownStartsAt,
    countdownSec,
    serverTime: Date.now(),
    players: [...match.players.values()].map((p) => ({
      socketId: p.socketId,
      userDetails: { name: p.nickname },
      score: p.score,
      currentIndex: p.currentIndex
    })),
    questions: match.questions.map(sanitizeQuestionForClient)
  });
});

app.get("/api/sessions", async (req, res): Promise<any> => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });
    
    const sessions = await ChallengeSession.find({
      status: "completed",
      "players.userDetails.name": userId
    }).sort({ updatedAt: -1 } as any);
    
    return res.json(sessions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Setup real-time Coding Duel Gateway
setupSocketGateway(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
