import { Router } from "express";
import multer from "multer";

import {
  uploadFile,
  createUploadUrl,
  completeUpload,
  getMyFiles,
  downloadFile,
  updateFileVisibility,
  createShareLink,
  deleteFile,
} from "../controllers/fileController";

import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();


router.post(
  "/upload",
  protect,
  (req, res, next) => {
    upload.single("file")(req, res, (error) => {
      if (error) {
        if (
          error instanceof multer.MulterError &&
          error.code === "LIMIT_FILE_SIZE"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "File is too large. Maximum allowed file size is 100 MB.",
          });
        }

        if (error instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: error.message,
          });
        }

        if (
          error instanceof Error &&
          error.message.includes("Invalid file type")
        ) {
          return res.status(400).json({
            success: false,
            message: error.message,
          });
        }

        return next(error);
      }

      next();
    });
  },
  uploadFile
);

router.post(
  "/upload-url",
  protect,
  createUploadUrl
);

router.post(
  "/upload-complete",
  protect,
  completeUpload
);
router.get(
  "/",
  protect,
  getMyFiles
);

router.get(
  "/:id/download",
  protect,
  downloadFile
);
router.patch(
  "/:id/visibility",
  protect,
  updateFileVisibility
);
router.post(
  "/:id/share",
  protect,
  createShareLink
);

router.delete(
  "/:fileId",
  protect,
  deleteFile
);
export default router;