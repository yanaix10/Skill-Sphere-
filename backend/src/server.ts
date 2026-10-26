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
import { setupSocketGateway } from './gateway/socketGateway.js';
import { markUnfinishedMatchesAsAbandoned } from './match/persistence.js';

const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: frontendOrigin,
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 60000,
});

connectDB();
markUnfinishedMatchesAsAbandoned();

app.use(cors({
    origin: frontendOrigin,
    credentials: true,
}));

app.use(express.json());

app.use('/api', duelRoutes);
app.use('/api/duel', duelRoutes);
app.use('/api/quiz', questionRoutes);
app.use('/api/challenge', challengeRoutes);

app.get("/", (req, res) => {
  res.send("Server working");
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
