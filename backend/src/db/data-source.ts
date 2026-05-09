import "reflect-metadata";
import path from "path";
import { DataSource } from "typeorm";
import { env } from "../config/env";
import { Inventory } from "../entities/Inventory";
import { MenuItem } from "../entities/MenuItem";
import { Outlet } from "../entities/Outlet";
import { OutletMenuItem } from "../entities/OutletMenuItem";
import { ReceiptSequence } from "../entities/ReceiptSequence";
import { Sale } from "../entities/Sale";
import { SaleItem } from "../entities/SaleItem";

const entityList = [
  Outlet,
  MenuItem,
  OutletMenuItem,
  Inventory,
  Sale,
  SaleItem,
  ReceiptSequence,
];

const sslStrict =
  env.db.ssl ? ({ ssl: { rejectUnauthorized: true } } as const) : {};

export const AppDataSource = new DataSource({
  type: "postgres",
  ...(env.db.databaseUrl
    ? {
        url: env.db.databaseUrl,
        ...sslStrict,
      }
    : {
        host: env.db.host,
        port: env.db.port,
        username: env.db.username,
        password: env.db.password,
        database: env.db.database,
        ...sslStrict,
      }),
  synchronize: false,
  logging: env.nodeEnv === "development",
  entities: entityList,
  migrations: [path.join(__dirname, "migrations", "*.{js,ts}")],
});
