import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";
import { connectDatabase, getDatabaseStatus } from "./config/database.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { roomsRouter } from "./routes/rooms.js";
import { progressRouter } from "./routes/progress.js";
import { badgesRouter } from "./routes/badges.js";
import { leaderboardRouter } from "./routes/leaderboard.js";

const app = express();
const httpServer = createServer(app);

// Socket.io for WebRTC signaling and real-time room events
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/progress", progressRouter);
app.use("/api/badges", badgesRouter);
app.use("/api/leaderboard", leaderboardRouter);

// Optional ZEGOCLOUD server token generation endpoint
app.get("/api/zego/config", (req, res) => {
  res.json({
    success: true,
    data: {
      hasAppId: Boolean(env.ZEGO_APP_ID),
      hasServerSecret: Boolean(env.ZEGO_SERVER_SECRET),
      configuredOnServer: Boolean(env.ZEGO_APP_ID && env.ZEGO_SERVER_SECRET),
    },
  });
});

// Root ping
app.get("/", (req, res) => {
  const db = getDatabaseStatus();
  res.json({
    name: "Ishara Connect API & Database Server",
    status: "running",
    database: db.status,
    docs: "/api/health",
  });
});

// WebRTC & Room signaling
io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, displayName }) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", { socketId: socket.id, displayName });

    socket.on("signal", ({ to, signal }) => {
      io.to(to).emit("signal", { from: socket.id, signal });
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", { socketId: socket.id });
    });
  });
});

// Connect to MongoDB and start HTTP server
async function startServer() {
  await connectDatabase();

  httpServer.listen(env.PORT, () => {
    console.log(`[Server] Ishara backend running on http://localhost:${env.PORT}`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
    console.log(`[Database] MongoDB URI configured. State: ${getDatabaseStatus().status}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Fatal error during startup:", err);
});
