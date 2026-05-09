import type { NextFunction, Request, Response } from "express";
import { QueryFailedError } from "typeorm";
import { ApiError } from "../utils/ApiError";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors ?? [],
    });
    return;
  }

  if (err instanceof QueryFailedError) {
    const msg = err.message ?? "";
    if (
      msg.includes("duplicate key") ||
      msg.includes("unique constraint") ||
      msg.includes("already exists")
    ) {
      res.status(409).json({
        success: false,
        message: "Resource already exists",
        errors: [],
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: "Database constraint error",
      errors: [],
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: [],
  });
}
