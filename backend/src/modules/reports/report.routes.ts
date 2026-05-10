import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as reportController from "./report.controller";
import {
  revenueByOutletSchema,
  topSellingItemsParamSchema,
} from "./report.validation";

export const reportRoutes = Router();

reportRoutes.get(
  "/revenue-by-outlet",
  validate(revenueByOutletSchema),
  asyncHandler(reportController.revenueByOutlet)
);

reportRoutes.get(
  "/outlets/:outletId/top-selling-items",
  validate(topSellingItemsParamSchema),
  asyncHandler(reportController.topSellingItems)
);
