import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";

const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode =
    err instanceof AppError ? err.statusCode : 500;

  const message =
    err instanceof AppError
      ? err.message
      : "Internal server error";

  console.error(err);

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorHandler;