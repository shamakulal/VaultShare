import { Router } from "express";

import {
  createShareLink,
  getShareLinkDetails,
  downloadSharedFile,
  verifySharePassword,
} from "../controllers/shareController";

import { protect } from "../middleware/authMiddleware";

const router = Router();

// Create share link
router.post(
  "/files/:fileId/share",
  protect,
  createShareLink
);
router.post(
  "/:shareToken/verify-password",
  verifySharePassword
);
// Public download
router.get(
  "/:shareToken/download",
  downloadSharedFile
);

// Public share details
router.get(
  "/:shareToken",
  getShareLinkDetails
);

export default router;