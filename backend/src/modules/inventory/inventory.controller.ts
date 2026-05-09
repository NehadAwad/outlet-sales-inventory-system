import type { Request, Response } from "express";
import { sendCreated, sendSuccess } from "../../utils/ApiResponse";
import type { CreateInventoryBody, UpdateInventoryBody } from "./inventory.validation";
import * as inventoryService from "./inventory.service";

export async function createInventory(req: Request, res: Response): Promise<void> {
  const { params, body } = req.validated as {
    params: { outletId: string };
    body: CreateInventoryBody;
  };
  const row = await inventoryService.createInventory(params.outletId, body);
  sendCreated(res, row, "Inventory created");
}

export async function listInventory(req: Request, res: Response): Promise<void> {
  const { params } = req.validated as { params: { outletId: string } };
  const rows = await inventoryService.getOutletInventory(params.outletId);
  sendSuccess(res, rows);
}

export async function updateInventory(req: Request, res: Response): Promise<void> {
  const { params, body } = req.validated as {
    params: { outletId: string; menuItemId: string };
    body: UpdateInventoryBody;
  };
  const row = await inventoryService.updateInventory(
    params.outletId,
    params.menuItemId,
    body
  );
  sendSuccess(res, row, "Inventory updated");
}
