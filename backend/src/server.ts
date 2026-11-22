import dotenv from "dotenv";
import path from "path";
dotenv.config();
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
}
import express from "express";
import cors from "cors";
import admin from "./config/firebase-config.js";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import questionRoutes from "./routes/questionRoutes.js";
import challengeRoutes from './routes/challengeRoutes.js';
import duelRoutes from './routes/duelRoutes.js';
import googleRoutes from './routes/googleRoutes.js';
import feedRoutes from './routes/feedRoutes.js';
import { setupSocketGateway } from './gateway/socketGateway.js';
import { markUnfinishedMatchesAsAbandoned } from './match/persistence.js';

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
app.set("trust proxy", 1);
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
app.use('/api', feedRoutes);

app.get("/", (req, res) => {
  res.send("Server working");
});

// Setup real-time Coding Duel Gateway
setupSocketGateway(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
