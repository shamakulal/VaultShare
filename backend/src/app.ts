import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import "dotenv/config";
import fileRoutes from "./routes/fileRoutes";
import authRoutes from "./routes/authRoutes";
import shareRoutes from "./routes/shareRoutes";

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

app.use(cookieParser());

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "VaultShare API is running",
  });
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