import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as saleController from "./sale.controller";
import {
  createSaleSchema,
  getSaleSchema,
  listSalesSchema,
} from "./sale.validation";

export const saleRoutes = Router({ mergeParams: true });

saleRoutes.post(
  "/",
  validate(createSaleSchema),
  asyncHandler(saleController.createSale)
);

saleRoutes.get(
  "/",
  validate(listSalesSchema),
  asyncHandler(saleController.listSales)
);

saleRoutes.get(
  "/:saleId",
  validate(getSaleSchema),
  asyncHandler(saleController.getSale)
);
