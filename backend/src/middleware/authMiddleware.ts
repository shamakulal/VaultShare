import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: number;
  };
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // ==========================================
    // 1. Try to get token from cookie
    // ==========================================

    let token = req.cookies?.token;

    // ==========================================
    // 2. If no cookie, try Authorization header
    // ==========================================

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;

      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    // ==========================================
    // 3. No token found
    // ==========================================

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    // ==========================================
    // 4. Get JWT secret
    // ==========================================

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    // ==========================================
    // 5. Verify JWT
    // ==========================================

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // ==========================================
    // 6. Check user ID
    // ==========================================

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // ==========================================
    // 7. Attach user to request
    // ==========================================

    req.user = {
      id: Number(decoded.userId),
    };

    // ==========================================
    // 8. Continue to controller
    // ==========================================

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token. Please log in again.",
    });
  }
};