import path from "path";
import { supabase } from "../config/supabase";
import { Response } from "express";
import { updateVisibilitySchema } from "../validators/fileValidator";
import pool from "../config/db";
import AppError from "../utils/AppError";
import asyncHandler from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import crypto from "crypto";

export const uploadFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // 1. Check authentication
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    // 2. Check whether a file was uploaded
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    const userId = req.user.id;
    const file = req.file;

    // 3. Get file extension
    const extension = path.extname(file.originalname).toLowerCase();

    // 4. Create unique filename
    const uniqueFileName = `${crypto.randomUUID()}${extension}`;

    // 5. Create Supabase storage path
    const storageKey = `users/${userId}/${uniqueFileName}`;
    console.log("Supabase bucket:", process.env.SUPABASE_BUCKET);
    console.log("Storage key:", storageKey);
    // 6. Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(storageKey, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);

      throw new AppError(
        `Failed to upload file to storage: ${uploadError.message}`,
        500,
      );
    }

    try {
      // 7. Save file metadata in MySQL
      const [result] = await pool.execute(
        `
        INSERT INTO files (
          user_id,
          original_name,
          storage_key,
          mime_type,
          size_bytes,
          visibility
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          file.originalname,
          storageKey,
          file.mimetype,
          file.size,
          "private",
        ],
      );

      const fileId = (result as any).insertId;

      // 8. Return success response
      return res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          file: {
            id: fileId,
            originalName: file.originalname,
            storageKey,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            visibility: "private",
            createdAt: new Date(),
          },
        },
      });
    } catch (error) {
      // 9. If MySQL save fails, remove file from Supabase
      await supabase.storage
        .from(process.env.SUPABASE_BUCKET!)
        .remove([storageKey]);

      throw error;
    }
  },
);
export const createUploadUrl = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { fileName, mimeType } = req.body;

    if (!fileName || !mimeType) {
      throw new AppError("File name and MIME type are required", 400);
    }

    const extension = path.extname(fileName).toLowerCase();

    const uniqueFileName = `${crypto.randomUUID()}${extension}`;

    const storageKey = `users/${req.user.id}/${uniqueFileName}`;

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .createSignedUploadUrl(storageKey);

    if (error || !data) {
      console.error("Create signed upload URL error:", error);

      throw new AppError(
        "Failed to create upload URL",
        500
      );
    }

    res.status(200).json({
      success: true,
      data: {
        path: storageKey,
        token: data.token,
      },
    });
  }
);

export const completeUpload = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const {
      originalName,
      storageKey,
      mimeType,
      sizeBytes,
    } = req.body;

    if (
      !originalName ||
      !storageKey ||
      !mimeType ||
      !sizeBytes
    ) {
      throw new AppError(
        "Missing upload metadata",
        400
      );
    }

    // Security check:
    // User can only save files inside their own folder
    const expectedPrefix = `users/${req.user.id}/`;

    if (!storageKey.startsWith(expectedPrefix)) {
      throw new AppError(
        "Invalid storage path",
        403
      );
    }

    const [result] = await pool.execute(
      `
      INSERT INTO files (
        user_id,
        original_name,
        storage_key,
        mime_type,
        size_bytes,
        visibility
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        req.user.id,
        originalName,
        storageKey,
        mimeType,
        sizeBytes,
        "private",
      ]
    );

    const fileId = (result as any).insertId;

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        file: {
          id: fileId,
          originalName,
          storageKey,
          mimeType,
          sizeBytes,
          visibility: "private",
          createdAt: new Date(),
        },
      },
    });
  }
);






export const getMyFiles = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // 1. Check authentication
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const userId = req.user.id;

    // 2. Get only this user's files
    const [files] = await pool.execute(
      `
      SELECT
        id,
        original_name,
        storage_key,
        mime_type,
        size_bytes,
        visibility,
        created_at,
        updated_at
      FROM files
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId],
    );

    // 3. Return files
    res.status(200).json({
      success: true,
      data: {
        files,
      },
    });
  },
);

export const downloadFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const fileId = Number(req.params.id);

    if (!Number.isInteger(fileId) || fileId <= 0) {
      throw new AppError("Invalid file ID", 400);
    }

    const userId = req.user.id;

    // Get file from MySQL
    const [rows] = await pool.execute(
      `
      SELECT
        id,
        original_name,
        storage_key,
        mime_type
      FROM files
      WHERE id = ?
      AND user_id = ?
      LIMIT 1
      `,
      [fileId, userId],
    );

    const files = rows as any[];

    if (files.length === 0) {
      throw new AppError("File not found or you do not have permission", 404);
    }

    const file = files[0];

    // Download from Supabase Storage
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .download(file.storage_key);

    if (error || !data) {
      console.error("Supabase download error:", error);

      throw new AppError("Failed to download file from storage", 500);
    }

    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Send file to browser
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(file.original_name)}"`,
    );

    res.setHeader("Content-Type", file.mime_type || "application/octet-stream");

    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);
  },
);
export const updateFileVisibility = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // 1. Check authenticated user
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const userId = req.user.id;

    // 2. Validate file ID
    const fileId = Number(req.params.id);

    if (!Number.isInteger(fileId) || fileId <= 0) {
      throw new AppError("Invalid file ID", 400);
    }

    // 3. Validate request body
    const validatedData = updateVisibilitySchema.safeParse(req.body);

    if (!validatedData.success) {
      throw new AppError(validatedData.error.issues[0].message, 400);
    }

    const { visibility } = validatedData.data;

    // 4. Check that file exists AND belongs to current user
    const [files] = await pool.execute(
      `
      SELECT id, user_id, visibility
      FROM files
      WHERE id = ?
      LIMIT 1
      `,
      [fileId],
    );

    const fileList = files as any[];

    if (fileList.length === 0) {
      throw new AppError("File not found", 404);
    }

    const file = fileList[0];

    // 5. Important authorization check
    if (file.user_id !== userId) {
      throw new AppError("You are not authorized to modify this file", 403);
    }

    // 6. Update visibility
    await pool.execute(
      `
      UPDATE files
      SET visibility = ?
      WHERE id = ? AND user_id = ?
      `,
      [visibility, fileId, userId],
    );

    // 7. Return success
    res.status(200).json({
      success: true,
      message: `File is now ${visibility}`,
      data: {
        id: fileId,
        visibility,
      },
    });
  },
);

export const createShareLink = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // 1. Check authentication
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const userId = req.user.id;

    // 2. Validate file ID
    const fileId = Number(req.params.id);

    if (!Number.isInteger(fileId) || fileId <= 0) {
      throw new AppError("Invalid file ID", 400);
    }

    // 3. Find the file
    const [files] = await pool.execute(
      `
      SELECT id, user_id, visibility
      FROM files
      WHERE id = ?
      LIMIT 1
      `,
      [fileId],
    );

    const fileList = files as any[];

    // 4. Check file exists
    if (fileList.length === 0) {
      throw new AppError("File not found", 404);
    }

    const file = fileList[0];

    // 5. Check ownership
    if (file.user_id !== userId) {
      throw new AppError("You are not authorized to share this file", 403);
    }

    // 6. Only public files can be shared
    if (file.visibility !== "public") {
      throw new AppError(
        "File must be public before creating a share link",
        400,
      );
    }

    // 7. Generate cryptographically secure token
    const shareToken = crypto.randomBytes(32).toString("hex");

    // 8. Save share link
    const [result] = await pool.execute(
      `
      INSERT INTO share_links (
        file_id,
        share_token,
        is_active
      )
      VALUES (?, ?, TRUE)
      `,
      [fileId, shareToken],
    );

    const shareLinkId = (result as any).insertId;

    // 9. Create frontend share URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const shareUrl = `${frontendUrl}/share/${shareToken}`;

    // 10. Return response
    res.status(201).json({
      success: true,
      message: "Share link created successfully",
      data: {
        shareLinkId,
        fileId,
        shareToken,
        shareUrl,
      },
    });
  },
);

export const deleteFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // 1. Authentication check
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const userId = req.user.id;
    const fileId = Number(req.params.fileId);

    // 2. Validate file ID
    if (!Number.isInteger(fileId) || fileId <= 0) {
      throw new AppError("Invalid file ID", 400);
    }

    // 3. Find file and verify ownership
    const [rows] = await pool.execute(
      `
      SELECT id, storage_key
      FROM files
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [fileId, userId],
    );

    const files = rows as any[];

    if (files.length === 0) {
      throw new AppError("File not found", 404);
    }

    const file = files[0];

    // 4. Delete physical file from Supabase Storage FIRST
    const { error: storageError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .remove([file.storage_key]);

    if (storageError) {
      console.error("Supabase delete error:", storageError);

      throw new AppError(
        `Failed to delete file from storage: ${storageError.message}`,
        500,
      );
    }

    // 5. Delete metadata from MySQL
    await pool.execute(
      `
      DELETE FROM files
      WHERE id = ? AND user_id = ?
      `,
      [fileId, userId],
    );

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  },
);
