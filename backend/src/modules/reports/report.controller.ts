import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/ApiResponse";
import * as reportService from "./report.service";

export async function revenueByOutlet(_req: Request, res: Response): Promise<void> {
  const data = await reportService.getRevenueByOutletReport();
  sendSuccess(res, data);
}

export async function topSellingItems(req: Request, res: Response): Promise<void> {
  const { params } = req.validated as { params: { outletId: string } };
  const data = await reportService.getTopSellingItemsReport(params.outletId);
  sendSuccess(res, data);
}
