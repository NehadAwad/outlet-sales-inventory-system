import { QueryFailedError } from "typeorm";
import { ApiError } from "../../utils/ApiError";
import { menuItemRepository } from "../menu-items/menuItem.repository";
import { outletRepository } from "../outlets/outlet.repository";
import type { AssignOutletMenuBody, UpdateOutletMenuBody } from "./outletMenu.validation";
import { outletMenuRepository } from "./outletMenu.repository";
import type { OutletMenuItem } from "../../entities/OutletMenuItem";

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof QueryFailedError &&
    (err as QueryFailedError & { driverError?: { code?: string } }).driverError
      ?.code === "23505"
  );
}

export async function assignMenuItemToOutlet(
  outletId: string,
  input: AssignOutletMenuBody
): Promise<OutletMenuItem> {
  const outlet = await outletRepository.findById(outletId);
  if (!outlet) {
    throw ApiError.notFound("Outlet not found");
  }

  const menuItem = await menuItemRepository.findById(input.menuItemId);
  if (!menuItem) {
    throw ApiError.notFound("Menu item not found");
  }
  if (!menuItem.isActive) {
    throw ApiError.badRequest("Cannot assign an inactive menu item");
  }

  const existing = await outletMenuRepository.findByOutletAndMenuItem(
    outletId,
    input.menuItemId
  );
  if (existing) {
    if (!existing.isActive) {
      existing.price = input.price;
      existing.isActive = true;
      await outletMenuRepository.save(existing);
      const refreshed = await outletMenuRepository.findByOutletAndMenuItem(
        outletId,
        input.menuItemId
      );
      return refreshed ?? existing;
    }
    throw ApiError.conflict("Menu item is already assigned to this outlet");
  }

  const row = outletMenuRepository.create({
    outletId,
    menuItemId: input.menuItemId,
    price: input.price,
    isActive: true,
  });

  try {
    const saved = await outletMenuRepository.save(row);
    const withRelation = await outletMenuRepository.findByOutletAndMenuItem(
      outletId,
      saved.menuItemId
    );
    return withRelation ?? saved;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw ApiError.conflict("Menu item is already assigned to this outlet");
    }
    throw err;
  }
}

export async function getOutletMenuItems(
  outletId: string
): Promise<OutletMenuItem[]> {
  const outlet = await outletRepository.findById(outletId);
  if (!outlet) {
    throw ApiError.notFound("Outlet not found");
  }
  return outletMenuRepository.findAllByOutletId(outletId);
}

export async function updateOutletMenuItem(
  outletId: string,
  menuItemId: string,
  body: UpdateOutletMenuBody
): Promise<OutletMenuItem> {
  const outlet = await outletRepository.findById(outletId);
  if (!outlet) {
    throw ApiError.notFound("Outlet not found");
  }

  const row = await outletMenuRepository.findByOutletAndMenuItem(
    outletId,
    menuItemId
  );
  if (!row) {
    throw ApiError.notFound("Assignment not found for this outlet");
  }

  if (body.price !== undefined) {
    row.price = body.price;
  }
  if (body.isActive !== undefined) {
    row.isActive = body.isActive;
  }

  await outletMenuRepository.save(row);
  const refreshed = await outletMenuRepository.findByOutletAndMenuItem(
    outletId,
    menuItemId
  );
  return refreshed ?? row;
}

export async function removeOutletMenuItem(
  outletId: string,
  menuItemId: string
): Promise<void> {
  const outlet = await outletRepository.findById(outletId);
  if (!outlet) {
    throw ApiError.notFound("Outlet not found");
  }

  const row = await outletMenuRepository.findByOutletAndMenuItem(
    outletId,
    menuItemId
  );
  if (!row) {
    throw ApiError.notFound("Assignment not found for this outlet");
  }

  row.isActive = false;
  await outletMenuRepository.save(row);
}
