import { QueryFailedError } from "typeorm";
import type { Inventory } from "../../entities/Inventory";
import { ApiError } from "../../utils/ApiError";
import { menuItemRepository } from "../menu-items/menuItem.repository";
import { outletRepository } from "../outlets/outlet.repository";
import type { CreateInventoryBody, UpdateInventoryBody } from "./inventory.validation";
import { inventoryRepository } from "./inventory.repository";

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof QueryFailedError &&
    (err as QueryFailedError & { driverError?: { code?: string } }).driverError
      ?.code === "23505"
  );
}

function isCheckViolation(err: unknown): boolean {
  return (
    err instanceof QueryFailedError &&
    (err as QueryFailedError & { driverError?: { code?: string } }).driverError
      ?.code === "23514"
  );
}

export async function createInventory(
  outletId: string,
  body: CreateInventoryBody
): Promise<Inventory> {
  const outlet = await outletRepository.findById(outletId);
  if (!outlet) {
    throw ApiError.notFound("Outlet not found");
  }

  const menuItem = await menuItemRepository.findById(body.menuItemId);
  if (!menuItem) {
    throw ApiError.notFound("Menu item not found");
  }

  const existing = await inventoryRepository.findByOutletAndMenuItem(
    outletId,
    body.menuItemId
  );
  if (existing) {
    throw ApiError.conflict("Inventory already exists for this outlet and menu item");
  }

  const row = inventoryRepository.create({
    outletId,
    menuItemId: body.menuItemId,
    stockQty: body.stockQty,
  });

  try {
    const saved = await inventoryRepository.save(row);
    const withRelation = await inventoryRepository.findByOutletAndMenuItem(
      outletId,
      saved.menuItemId
    );
    return withRelation ?? saved;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw ApiError.conflict("Inventory already exists for this outlet and menu item");
    }
    throw err;
  }
}

export async function getOutletInventory(outletId: string): Promise<Inventory[]> {
  const outlet = await outletRepository.findById(outletId);
  if (!outlet) {
    throw ApiError.notFound("Outlet not found");
  }
  return inventoryRepository.findAllByOutletId(outletId);
}

export async function updateInventory(
  outletId: string,
  menuItemId: string,
  body: UpdateInventoryBody
): Promise<Inventory> {
  const outlet = await outletRepository.findById(outletId);
  if (!outlet) {
    throw ApiError.notFound("Outlet not found");
  }

  const row = await inventoryRepository.findByOutletAndMenuItem(
    outletId,
    menuItemId
  );
  if (!row) {
    throw ApiError.notFound("Inventory record not found for this outlet and menu item");
  }

  row.stockQty = body.stockQty;

  try {
    await inventoryRepository.save(row);
    const refreshed = await inventoryRepository.findByOutletAndMenuItem(
      outletId,
      menuItemId
    );
    return refreshed ?? row;
  } catch (err) {
    if (isCheckViolation(err)) {
      throw ApiError.badRequest("stockQty must be non-negative");
    }
    throw err;
  }
}
