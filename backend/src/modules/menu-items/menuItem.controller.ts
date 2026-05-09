import type { Request, Response } from "express";
import { sendCreated, sendSuccess } from "../../utils/ApiResponse";
import type { CreateMenuItemBody, UpdateMenuItemBody } from "./menuItem.validation";
import * as menuItemService from "./menuItem.service";

export async function createMenuItem(req: Request, res: Response): Promise<void> {
  const { body } = req.validated as { body: CreateMenuItemBody };
  const item = await menuItemService.createMenuItem(body);
  sendCreated(res, item, "Menu item created");
}

export async function listMenuItems(_req: Request, res: Response): Promise<void> {
  const items = await menuItemService.getAllMenuItems();
  sendSuccess(res, items);
}

export async function getMenuItemById(req: Request, res: Response): Promise<void> {
  const { params } = req.validated as { params: { menuItemId: string } };
  const item = await menuItemService.getMenuItemById(params.menuItemId);
  sendSuccess(res, item);
}

export async function updateMenuItem(req: Request, res: Response): Promise<void> {
  const { params, body } = req.validated as {
    params: { menuItemId: string };
    body: UpdateMenuItemBody;
  };
  const item = await menuItemService.updateMenuItem(params.menuItemId, body);
  sendSuccess(res, item, "Menu item updated");
}

export async function deleteMenuItem(req: Request, res: Response): Promise<void> {
  const { params } = req.validated as { params: { menuItemId: string } };
  await menuItemService.softDeleteMenuItem(params.menuItemId);
  sendSuccess(res, undefined, "Menu item deactivated");
}
