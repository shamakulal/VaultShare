import { Request, Response, NextFunction } from "express";
import multer from "multer";

export const handleUploadError = (
  error: any,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // Multer errors
  if (error instanceof multer.MulterError) {
    // File is larger than allowed limit
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File is too large. Maximum allowed file size is 100 MB.",
      });
    }

    // More than one file uploaded
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Only one file can be uploaded at a time.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Custom invalid file type error
  if (error instanceof Error) {
    if (error.message.includes("Invalid file type")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Pass other errors to the global error handler
  next(error);
};