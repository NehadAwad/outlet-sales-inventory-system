import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { inventoryRoutes } from "../inventory/inventory.routes";
import * as outletController from "./outlet.controller";
import { outletMenuRoutes } from "../outlet-menu/outletMenu.routes";
import { saleRoutes } from "../sales/sale.routes";
import {
  createOutletSchema,
  outletIdParamSchema,
  updateOutletSchema,
} from "./outlet.validation";

export const outletRoutes = Router();

outletRoutes.post(
  "/",
  validate(createOutletSchema),
  asyncHandler(outletController.createOutlet)
);

outletRoutes.get("/", asyncHandler(outletController.listOutlets));

outletRoutes.use("/:outletId/menu-items", outletMenuRoutes);

outletRoutes.use("/:outletId/inventory", inventoryRoutes);

outletRoutes.use("/:outletId/sales", saleRoutes);

outletRoutes.get(
  "/:outletId",
  validate(outletIdParamSchema),
  asyncHandler(outletController.getOutletById)
);

outletRoutes.patch(
  "/:outletId",
  validate(updateOutletSchema),
  asyncHandler(outletController.updateOutlet)
);
