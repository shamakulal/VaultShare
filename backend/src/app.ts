import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import "dotenv/config";
import fileRoutes from "./routes/fileRoutes";
import authRoutes from "./routes/authRoutes";
import shareRoutes from "./routes/shareRoutes";
import pool from "./config/db";
const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://vaultshare10.netlify.app",
    ],
    credentials: true,
  }),
);

app.use(express.json());

app.use(cookieParser());

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      success: true,
      message: "VaultShare backend is healthy",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    res.status(503).json({
      success: false,
      message: "Backend is running but database is unavailable",
      database: "disconnected",
    });
  }
});

// ==========================================
// ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/files", fileRoutes);

app.use("/api/share", shareRoutes);

// ==========================================
// NOT FOUND HANDLER
// MUST ALWAYS BE LAST
// ==========================================

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;