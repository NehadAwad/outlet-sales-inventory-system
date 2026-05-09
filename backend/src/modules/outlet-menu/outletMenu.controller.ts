import type { Request, Response } from "express";
import { sendCreated, sendSuccess } from "../../utils/ApiResponse";
import type { AssignOutletMenuBody, UpdateOutletMenuBody } from "./outletMenu.validation";
import * as outletMenuService from "./outletMenu.service";

export async function assignMenuItem(req: Request, res: Response): Promise<void> {
  const { params, body } = req.validated as {
    params: { outletId: string };
    body: AssignOutletMenuBody;
  };
  const row = await outletMenuService.assignMenuItemToOutlet(params.outletId, body);
  sendCreated(res, row, "Menu item assigned to outlet");
}

export async function listOutletMenu(req: Request, res: Response): Promise<void> {
  const { params } = req.validated as { params: { outletId: string } };
  const rows = await outletMenuService.getOutletMenuItems(params.outletId);
  sendSuccess(res, rows);
}

export async function updateOutletMenu(req: Request, res: Response): Promise<void> {
  const { params, body } = req.validated as {
    params: { outletId: string; menuItemId: string };
    body: UpdateOutletMenuBody;
  };
  const row = await outletMenuService.updateOutletMenuItem(
    params.outletId,
    params.menuItemId,
    body
  );
  sendSuccess(res, row, "Outlet menu assignment updated");
}

export async function removeOutletMenu(req: Request, res: Response): Promise<void> {
  const { params } = req.validated as {
    params: { outletId: string; menuItemId: string };
  };
  await outletMenuService.removeOutletMenuItem(params.outletId, params.menuItemId);
  sendSuccess(res, undefined, "Outlet menu assignment removed");
}
