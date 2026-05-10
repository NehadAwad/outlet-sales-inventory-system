import "reflect-metadata";
import type { EntityManager } from "typeorm";
import { AppDataSource } from "./data-source";
import { Inventory } from "../entities/Inventory";
import { MenuItem } from "../entities/MenuItem";
import { Outlet } from "../entities/Outlet";
import { OutletMenuItem } from "../entities/OutletMenuItem";
import { ReceiptSequence } from "../entities/ReceiptSequence";

const outletSeeds = [
  { name: "Downtown Branch", code: "DOWNTOWN" },
  { name: "Mall Branch", code: "MALL" },
] as const;

const menuItemSeeds = [
  { name: "Classic Burger", sku: "BURGER-001", basePrice: "12.50" },
  { name: "Margherita Pizza", sku: "PIZZA-001", basePrice: "15.00" },
  { name: "Iced Coffee", sku: "COFFEE-001", basePrice: "5.00" },
  { name: "Chicken Rice", sku: "RICE-001", basePrice: "10.00" },
] as const;

/** Outlet-specific menu assignment prices used by seed data */
const assignmentSeeds = [
  { outletCode: "DOWNTOWN", sku: "BURGER-001", price: "12.50" },
  { outletCode: "DOWNTOWN", sku: "COFFEE-001", price: "5.50" },
  { outletCode: "MALL", sku: "PIZZA-001", price: "16.00" },
  { outletCode: "MALL", sku: "COFFEE-001", price: "5.00" },
  { outletCode: "MALL", sku: "RICE-001", price: "11.00" },
] as const;

const inventorySeeds = [
  { outletCode: "DOWNTOWN", sku: "BURGER-001", stockQty: 100 },
  { outletCode: "DOWNTOWN", sku: "COFFEE-001", stockQty: 200 },
  { outletCode: "MALL", sku: "PIZZA-001", stockQty: 80 },
  { outletCode: "MALL", sku: "COFFEE-001", stockQty: 150 },
  { outletCode: "MALL", sku: "RICE-001", stockQty: 60 },
] as const;

async function ensureReceiptSequence(
  manager: EntityManager,
  outletId: string
): Promise<void> {
  const existing = await manager.findOne(ReceiptSequence, {
    where: { outletId },
  });
  if (!existing) {
    await manager.save(
      manager.create(ReceiptSequence, {
        outletId,
        lastNumber: 0,
      })
    );
  }
}

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  try {
    await AppDataSource.transaction(async (manager) => {
      const outletByCode = new Map<string, Outlet>();

      for (const row of outletSeeds) {
        let outlet = await manager.findOne(Outlet, {
          where: { code: row.code },
        });
        if (!outlet) {
          outlet = manager.create(Outlet, {
            name: row.name,
            code: row.code,
            address: null,
            isActive: true,
          });
          await manager.save(outlet);
          await ensureReceiptSequence(manager, outlet.id);
        } else {
          await ensureReceiptSequence(manager, outlet.id);
        }
        outletByCode.set(row.code, outlet);
      }

      const menuBySku = new Map<string, MenuItem>();

      for (const row of menuItemSeeds) {
        let item = await manager.findOne(MenuItem, {
          where: { sku: row.sku },
        });
        if (!item) {
          item = manager.create(MenuItem, {
            name: row.name,
            sku: row.sku,
            basePrice: row.basePrice,
            description: null,
            isActive: true,
          });
          await manager.save(item);
        }
        menuBySku.set(row.sku, item);
      }

      for (const row of assignmentSeeds) {
        const outlet = outletByCode.get(row.outletCode);
        const menuItem = menuBySku.get(row.sku);
        if (!outlet || !menuItem) {
          throw new Error(
            `Seed invariant: missing outlet or menu for assignment ${row.outletCode} / ${row.sku}`
          );
        }

        let om = await manager.findOne(OutletMenuItem, {
          where: { outletId: outlet.id, menuItemId: menuItem.id },
        });
        if (!om) {
          om = manager.create(OutletMenuItem, {
            outletId: outlet.id,
            menuItemId: menuItem.id,
            price: row.price,
            isActive: true,
          });
        } else {
          om.price = row.price;
          om.isActive = true;
        }
        await manager.save(om);
      }

      for (const row of inventorySeeds) {
        const outlet = outletByCode.get(row.outletCode);
        const menuItem = menuBySku.get(row.sku);
        if (!outlet || !menuItem) {
          throw new Error(
            `Seed invariant: missing outlet or menu for inventory ${row.outletCode} / ${row.sku}`
          );
        }

        let inv = await manager.findOne(Inventory, {
          where: { outletId: outlet.id, menuItemId: menuItem.id },
        });
        if (!inv) {
          inv = manager.create(Inventory, {
            outletId: outlet.id,
            menuItemId: menuItem.id,
            stockQty: row.stockQty,
          });
        } else {
          inv.stockQty = row.stockQty;
        }
        await manager.save(inv);
      }
    });

    console.log("Seed finished successfully (idempotent upsert).");
  } finally {
    await AppDataSource.destroy();
  }
}

void seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
