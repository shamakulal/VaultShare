import { Router } from "express";

import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/authController";

import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", protect, getMe);

router.post("/logout", protect, logout);

export default router;