import type { Response } from "express";

export interface ApiSuccessBody<T> {
  success: true;
  data?: T;
  message?: string;
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): Response {
  const body: ApiSuccessBody<T> = { success: true };
  if (data !== undefined) {
    body.data = data;
  }
  if (message !== undefined) {
    body.message = message;
  }
  return res.status(statusCode).json(body);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message?: string
): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}
