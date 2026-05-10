import { ApiError } from "../../utils/ApiError";
import { outletRepository } from "../outlets/outlet.repository";
import {
  type RevenueByOutletRow,
  type TopSellingItemRow,
  reportRepository,
} from "./report.repository";

export async function getRevenueByOutletReport(): Promise<RevenueByOutletRow[]> {
  return reportRepository.getRevenueByOutlet();
}

export async function getTopSellingItemsReport(
  outletId: string
): Promise<TopSellingItemRow[]> {
  const outlet = await outletRepository.findById(outletId);
  if (!outlet) {
    throw ApiError.notFound("Outlet not found");
  }
  return reportRepository.getTopSellingItemsByOutlet(outletId);
}
