import { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../config/db";
import AppError from "../utils/AppError";
import asyncHandler from "../utils/asyncHandler";
import generateToken from "../utils/generateToken";
import { registerSchema, loginSchema } from "../validators/authValidator";
import { AuthRequest } from "../middleware/authMiddleware";
export const register = asyncHandler(async (req: Request, res: Response) => {
  // 1. Validate input
  const validatedData = registerSchema.safeParse(req.body);

  if (!validatedData.success) {
    throw new AppError(validatedData.error.issues[0].message, 400);
  }

  const { name, email, password } = validatedData.data;

  // 2. Check whether email already exists
  const [existingUsers] = await pool.execute(
    "SELECT id FROM users WHERE email = ?",
    [email],
  );

  if (Array.isArray(existingUsers) && existingUsers.length > 0) {
    throw new AppError("An account with this email already exists", 409);
  }

  // 3. Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // 4. Create user
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
    [name, email, passwordHash],
  );

  // 5. Get new user ID
  const userId = (result as any).insertId;

  // 6. Generate JWT
  const token = generateToken(userId);

  // 7. Store JWT in HTTP-only cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
  });

  // 8. Return response
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: {
        id: userId,
        name,
        email,
      },
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  // 1. Validate input
  const validatedData = loginSchema.safeParse(req.body);

  if (!validatedData.success) {
    throw new AppError(validatedData.error.issues[0].message, 400);
  }

  const { email, password } = validatedData.data;

  // 2. Find user
  const [users] = await pool.execute(
    `SELECT id, name, email, password_hash
       FROM users
       WHERE email = ?`,
    [email],
  );

  const userList = users as any[];

  if (userList.length === 0) {
    throw new AppError("Invalid email or password", 401);
  }

  const user = userList[0];

  // 3. Compare password
  const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 401);
  }

  // 4. Generate JWT
  const token = generateToken(user.id);

  // 5. Store JWT in cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
  });

  // 6. Send response
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie("token", {
  httpOnly: true,
  secure: true,
  sameSite: "none",
});

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const [users] = await pool.execute(
      `
      SELECT id, name, email, created_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [req.user.id],
    );

    const userList = users as Array<{
      id: number;
      name: string;
      email: string;
      created_at: string;
    }>;

    if (userList.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: userList[0],
    });
  } catch (error) {
    console.error("GET CURRENT USER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user information.",
    });
  }
};

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Authentication required. Please log in.", 401);
  }

  const [users] = await pool.execute(
    `SELECT id, name, email, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
    [req.user.id],
  );

  const userList = users as any[];

  if (userList.length === 0) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    data: {
      user: userList[0],
    },
  });
});
