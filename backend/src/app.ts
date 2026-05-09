import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import { sendSuccess } from "./utils/ApiResponse";

export const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  sendSuccess(res, { ok: true }, "POS API is running");
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);
