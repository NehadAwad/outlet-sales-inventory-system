import "reflect-metadata";
import { app } from "./app";
import { env } from "./config/env";
import { AppDataSource } from "./db/data-source";

async function bootstrap(): Promise<void> {
  try {
    await AppDataSource.initialize();
    app.listen(env.port);
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

void bootstrap();
