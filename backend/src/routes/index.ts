import { Router } from "express";
import authRoutes from "./authRoutes";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "VaultShare API v1",
  });
});

router.use("/auth", authRoutes);

export default router;