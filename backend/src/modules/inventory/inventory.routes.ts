import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as inventoryController from "./inventory.controller";
import {
  createInventorySchema,
  listInventorySchema,
  updateInventorySchema,
} from "./inventory.validation";

export const inventoryRoutes = Router({ mergeParams: true });

inventoryRoutes.post(
  "/",
  validate(createInventorySchema),
  asyncHandler(inventoryController.createInventory)
);

inventoryRoutes.get(
  "/",
  validate(listInventorySchema),
  asyncHandler(inventoryController.listInventory)
);

inventoryRoutes.patch(
  "/:menuItemId",
  validate(updateInventorySchema),
  asyncHandler(inventoryController.updateInventory)
);
