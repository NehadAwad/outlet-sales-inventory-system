import dotenv from "dotenv";

dotenv.config();

const databaseUrlRaw = process.env.DATABASE_URL?.trim();
const databaseUrl =
  databaseUrlRaw && databaseUrlRaw.length > 0 ? databaseUrlRaw : undefined;

const DEFAULT_DEV_CORS = "http://localhost:5173";

function parseCorsOrigins(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === "") {
    return [DEFAULT_DEV_CORS];
  }
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return list.length > 0 ? list : [DEFAULT_DEV_CORS];
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),
  corsAllowedOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  db: {
    databaseUrl,
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    database: process.env.DB_NAME ?? "pos_db",
    ssl:
      Boolean(databaseUrl) ||
      process.env.DB_SSL === "true" ||
      process.env.DB_SSL === "1" ||
      process.env.PGSSLMODE === "require",
  },
};
