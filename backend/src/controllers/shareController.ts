import bcrypt from "bcrypt";

import crypto from "crypto";
import pool from "../config/db";
import AppError from "../utils/AppError";
import asyncHandler from "../utils/asyncHandler";
import { supabase } from "../config/supabase";
import { AuthRequest } from "../middleware/authMiddleware";
import { Request, Response } from "express";

export const createShareLink = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // ==========================================
    // 1. Get file ID from URL
    // ==========================================

    const fileId = Number(req.params.fileId);

    if (!Number.isInteger(fileId) || fileId <= 0) {
      throw new AppError("Invalid file ID", 400);
    }

    // ==========================================
    // 2. Get optional settings from request body
    // ==========================================

    const { password, expiresAt, maxDownloads } = req.body;

    // ==========================================
    // 3. Check logged-in user
    // ==========================================

    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const userId = req.user.id;

    // ==========================================
    // 4. Check that the file exists
    // AND belongs to this user
    // ==========================================

    const [files] = await pool.execute(
      `
      SELECT id, original_name, visibility
      FROM files
      WHERE id = ?
      AND user_id = ?
      LIMIT 1
      `,
      [fileId, userId],
    );

    const fileList = files as any[];

    if (fileList.length === 0) {
      throw new AppError(
        "File not found or you do not have permission to share it",
        404,
      );
    }
    // Private files must have a password before they can be shared
    if (fileList[0].visibility === "private" && !password) {
      throw new AppError(
        "Password is required when sharing a private file",
        400,
      );
    }
    // ==========================================
    // 5. Generate unique share token
    // ==========================================

    const shareToken = crypto.randomBytes(32).toString("hex");

    // ==========================================
    // 6. Hash password if provided
    // ==========================================

    let passwordHash: string | null = null;

    if (password && password.trim().length > 0) {
      passwordHash = await bcrypt.hash(password.trim(), 12);
    }

    // ==========================================
    // 7. Validate max downloads
    // ==========================================

    let validatedMaxDownloads: number | null = null;

    if (
      maxDownloads !== undefined &&
      maxDownloads !== null &&
      maxDownloads !== ""
    ) {
      const parsedMaxDownloads = Number(maxDownloads);

      if (!Number.isInteger(parsedMaxDownloads) || parsedMaxDownloads <= 0) {
        throw new AppError("maxDownloads must be a positive whole number", 400);
      }

      validatedMaxDownloads = parsedMaxDownloads;
    }

    // ==========================================
    // 8. Validate expiry date
    // ==========================================

    let validatedExpiresAt: string | null = null;

    if (expiresAt) {
      const expiryDate = new Date(expiresAt);

      if (Number.isNaN(expiryDate.getTime())) {
        throw new AppError("Invalid expiry date", 400);
      }

      if (expiryDate <= new Date()) {
        throw new AppError("Expiry date must be in the future", 400);
      }

      validatedExpiresAt = expiryDate
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
    }

    // ==========================================
    // 9. Create share link in database
    // ==========================================

    const [result] = await pool.execute(
      `
      INSERT INTO share_links (
        file_id,
        share_token,
        password_hash,
        expires_at,
        max_downloads
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        fileId,
        shareToken,
        passwordHash,
        validatedExpiresAt,
        validatedMaxDownloads,
      ],
    );

    const shareLinkId = (result as any).insertId;

    // ==========================================
    // 10. Send response
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Share link created successfully",
      data: {
        shareLink: {
          id: shareLinkId,
          fileId,
          shareToken,
          shareUrl: `http://localhost:5173/share/${shareToken}`,
          passwordProtected: passwordHash !== null,
          expiresAt: validatedExpiresAt,
          maxDownloads: validatedMaxDownloads,
          downloadCount: 0,
        },
      },
    });
  },
);
export const getShareLinkDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { shareToken } = req.params;

    // Find the share link and its file
    const [rows] = await pool.execute(
      `
      SELECT
        sl.id AS share_link_id,
        sl.share_token,
        sl.password_hash,
        sl.expires_at,
        sl.max_downloads,
        sl.download_count,
        sl.is_active,

        f.id AS file_id,
        f.original_name,
        f.mime_type,
        f.size_bytes,
        f.created_at

      FROM share_links sl
      INNER JOIN files f ON sl.file_id = f.id
      WHERE sl.share_token = ?
      LIMIT 1
      `,
      [shareToken],
    );

    const shareLinks = rows as any[];

    // Token does not exist
    if (shareLinks.length === 0) {
      throw new AppError("Share link not found", 404);
    }

    const shareLink = shareLinks[0];

    // Check whether link is active
    if (!shareLink.is_active) {
      throw new AppError("This share link has been disabled", 403);
    }

    // Check expiry
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      throw new AppError("This share link has expired", 403);
    }

    // Check download limit
    if (
      shareLink.max_downloads !== null &&
      shareLink.download_count >= shareLink.max_downloads
    ) {
      throw new AppError("Maximum download limit has been reached", 403);
    }

    // Return SAFE file information
    res.status(200).json({
      success: true,
      data: {
        shareLink: {
          id: shareLink.share_link_id,
          passwordProtected: !!shareLink.password_hash,
          expiresAt: shareLink.expires_at,
          maxDownloads: shareLink.max_downloads,
          downloadCount: shareLink.download_count,
        },

        file: {
          id: shareLink.file_id,
          originalName: shareLink.original_name,
          mimeType: shareLink.mime_type,
          sizeBytes: shareLink.size_bytes,
          createdAt: shareLink.created_at,
        },
      },
    });
  },
);

export const verifySharePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { shareToken } = req.params;
    const { password } = req.body;

    // 1. Validate password
    if (!password || typeof password !== "string") {
      throw new AppError("Password is required", 400);
    }

    // 2. Find share link
    const [shareLinks] = await pool.execute(
      `
      SELECT
        id,
        password_hash,
        is_active,
        expires_at
      FROM share_links
      WHERE share_token = ?
      LIMIT 1
      `,
      [shareToken],
    );

    const shareLinkList = shareLinks as any[];

    if (shareLinkList.length === 0) {
      throw new AppError("Share link not found", 404);
    }

    const shareLink = shareLinkList[0];

    // 3. Check whether link is active
    if (!shareLink.is_active) {
      throw new AppError("This share link is no longer active", 403);
    }

    // 4. Check expiry
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      throw new AppError("This share link has expired", 403);
    }

    // 5. If no password exists, no verification needed
    if (!shareLink.password_hash) {
      return res.status(200).json({
        success: true,
        message: "This share link is not password protected",
        data: {
          verified: true,
        },
      });
    }

    // 6. Compare entered password with hashed password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      shareLink.password_hash,
    );

    if (!isPasswordCorrect) {
      throw new AppError("Incorrect password", 401);
    }

    // 7. Password is correct
    const accessCookieName = `share_access_${shareLink.id}`;

    res.cookie(accessCookieName, "verified", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Password verified successfully",
      data: {
        verified: true,
      },
    });
  },
);
export const downloadSharedFile = asyncHandler(
  async (req: Request, res: Response) => {
    const { shareToken } = req.params;

    // ==========================================
    // 1. Find share link + file
    // ==========================================

    const [rows] = await pool.execute(
      `
      SELECT
        sl.id AS share_link_id,
        sl.password_hash,
        sl.expires_at,
        sl.max_downloads,
        sl.download_count,
        sl.is_active,

        f.id AS file_id,
        f.original_name,
        f.storage_key,
        f.mime_type

      FROM share_links sl
      INNER JOIN files f
        ON sl.file_id = f.id

      WHERE sl.share_token = ?

      LIMIT 1
      `,
      [shareToken],
    );

    const shareLinks = rows as any[];

    if (shareLinks.length === 0) {
      throw new AppError("Share link not found", 404);
    }

    const shareLink = shareLinks[0];

    // ==========================================
    // 2. Check active
    // ==========================================

    if (!shareLink.is_active) {
      throw new AppError(
        "This share link has been disabled",
        403,
      );
    }

    // ==========================================
    // 3. Check expiry
    // ==========================================

    if (
      shareLink.expires_at &&
      new Date(shareLink.expires_at) < new Date()
    ) {
      throw new AppError(
        "This share link has expired",
        403,
      );
    }

    // ==========================================
    // 4. Check download limit
    // ==========================================

    if (
      shareLink.max_downloads !== null &&
      shareLink.download_count >= shareLink.max_downloads
    ) {
      throw new AppError(
        "Maximum download limit has been reached",
        403,
      );
    }

    // ==========================================
    // 5. Check password
    // ==========================================

    if (shareLink.password_hash) {
      const accessCookieName =
        `share_access_${shareLink.share_link_id}`;

      if (
        req.cookies?.[accessCookieName] !== "verified"
      ) {
        throw new AppError(
          "Password verification is required before downloading",
          401,
        );
      }
    }

    // ==========================================
    // 6. Generate temporary signed URL
    // ==========================================

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .createSignedUrl(
        shareLink.storage_key,
        60,
        {
          download: true,
        },
      );

    if (error || !data?.signedUrl) {
      console.error(
        "Supabase signed URL error:",
        error,
      );

      throw new AppError(
        "Failed to create download URL",
        500,
      );
    }

    // ==========================================
    // 7. Increment download count
    // ==========================================

    await pool.execute(
      `
      UPDATE share_links
      SET download_count = download_count + 1
      WHERE id = ?
      `,
      [shareLink.share_link_id],
    );

    // ==========================================
    // 8. Return signed URL
    // ==========================================

    return res.status(200).json({
      success: true,
      data: {
        downloadUrl: data.signedUrl,
        fileName: shareLink.original_name,
      },
    });
  },
);