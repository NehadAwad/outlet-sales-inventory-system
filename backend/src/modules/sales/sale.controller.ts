import type { Request, Response } from "express";
import { sendCreated, sendSuccess } from "../../utils/ApiResponse";
import type { CreateSaleBody } from "./sale.validation";
import * as saleService from "./sale.service";

export async function createSale(req: Request, res: Response): Promise<void> {
  const { params, body } = req.validated as {
    params: { outletId: string };
    body: CreateSaleBody;
  };
  const sale = await saleService.createSale(params.outletId, body);
  sendCreated(res, sale, "Sale completed");
}

export async function listSales(req: Request, res: Response): Promise<void> {
  const { params } = req.validated as { params: { outletId: string } };
  const sales = await saleService.getSalesByOutlet(params.outletId);
  sendSuccess(res, sales);
}

export async function getSale(req: Request, res: Response): Promise<void> {
  const { params } = req.validated as {
    params: { outletId: string; saleId: string };
  };
  const sale = await saleService.getSaleById(params.outletId, params.saleId);
  sendSuccess(res, sale);
}
