import { QueryFailedError } from "typeorm";
import { MenuItem } from "../../entities/MenuItem";
import { ApiError } from "../../utils/ApiError";
import type { CreateMenuItemBody, UpdateMenuItemBody } from "./menuItem.validation";
import { menuItemRepository } from "./menuItem.repository";

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof QueryFailedError &&
    (err as QueryFailedError & { driverError?: { code?: string } }).driverError
      ?.code === "23505"
  );
}

export async function createMenuItem(input: CreateMenuItemBody): Promise<MenuItem> {
  const sku = input.sku.trim();
  const existing = await menuItemRepository.findBySku(sku);
  if (existing) {
    throw ApiError.conflict("SKU already exists");
  }

  const entity = menuItemRepository.create({
    name: input.name.trim(),
    sku,
    description: input.description ?? null,
    basePrice: input.basePrice,
    isActive: true,
  });

  try {
    return await menuItemRepository.save(entity);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw ApiError.conflict("SKU already exists");
    }
    throw err;
  }
}

export async function getAllMenuItems(): Promise<MenuItem[]> {
  return menuItemRepository.findAll();
}

export async function getMenuItemById(id: string): Promise<MenuItem> {
  const item = await menuItemRepository.findById(id);
  if (!item) {
    throw ApiError.notFound("Menu item not found");
  }
  return item;
}

export async function updateMenuItem(
  id: string,
  body: UpdateMenuItemBody
): Promise<MenuItem> {
  const item = await menuItemRepository.findById(id);
  if (!item) {
    throw ApiError.notFound("Menu item not found");
  }

  if (body.name !== undefined) {
    item.name = body.name.trim();
  }
  if (body.description !== undefined) {
    item.description = body.description;
  }
  if (body.basePrice !== undefined) {
    item.basePrice = body.basePrice;
  }
  if (body.isActive !== undefined) {
    item.isActive = body.isActive;
  }

  if (body.sku !== undefined) {
    const sku = body.sku.trim();
    if (sku !== item.sku) {
      const taken = await menuItemRepository.findBySku(sku);
      if (taken && taken.id !== id) {
        throw ApiError.conflict("SKU already exists");
      }
      item.sku = sku;
    }
  }

  try {
    return await menuItemRepository.save(item);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw ApiError.conflict("SKU already exists");
    }
    throw err;
  }
}

export async function softDeleteMenuItem(id: string): Promise<void> {
  const item = await menuItemRepository.findById(id);
  if (!item) {
    throw ApiError.notFound("Menu item not found");
  }
  item.isActive = false;
  await menuItemRepository.save(item);
}
