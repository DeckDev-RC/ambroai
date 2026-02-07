import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error";

import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";
import healthRoutes from "./routes/health";

const app = express();

// ── Security ────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

// ── Rate Limiting ───────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Muitas requisições. Tente novamente em 1 minuto." },
});
app.use(limiter);

// ── Body Parsing ────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));

// ── Request Logging ─────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ──────────────────────────────────────────────
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

// Protected routes (require JWT)
app.use("/api/auth/me", authMiddleware);
app.use("/api/chat", authMiddleware, chatRoutes);

// ── Error Handler ───────────────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🤖 Agente IA Ambro — Backend API      ║
  ║                                          ║
  ║   Port: ${env.PORT}                           ║
  ║   Env:  ${env.NODE_ENV.padEnd(30)}║
  ║   CORS: ${env.FRONTEND_URL.padEnd(30)}║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
