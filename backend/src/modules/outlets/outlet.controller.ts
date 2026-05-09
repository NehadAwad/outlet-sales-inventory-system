import type { Request, Response } from "express";
import { sendCreated, sendSuccess } from "../../utils/ApiResponse";
import type { CreateOutletBody, UpdateOutletBody } from "./outlet.validation";
import * as outletService from "./outlet.service";

export async function createOutlet(req: Request, res: Response): Promise<void> {
  const { body } = req.validated as { body: CreateOutletBody };
  const outlet = await outletService.createOutlet(body);
  sendCreated(res, outlet, "Outlet created");
}

export async function listOutlets(_req: Request, res: Response): Promise<void> {
  const outlets = await outletService.getAllOutlets();
  sendSuccess(res, outlets);
}

export async function getOutletById(req: Request, res: Response): Promise<void> {
  const { params } = req.validated as { params: { outletId: string } };
  const outlet = await outletService.getOutletById(params.outletId);
  sendSuccess(res, outlet);
}

export async function updateOutlet(req: Request, res: Response): Promise<void> {
  const { params, body } = req.validated as {
    params: { outletId: string };
    body: UpdateOutletBody;
  };
  const outlet = await outletService.updateOutlet(params.outletId, body);
  sendSuccess(res, outlet, "Outlet updated");
}
