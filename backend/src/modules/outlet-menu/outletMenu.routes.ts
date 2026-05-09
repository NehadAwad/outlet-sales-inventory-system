import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as outletMenuController from "./outletMenu.controller";
import {
  assignOutletMenuSchema,
  listOutletMenuSchema,
  removeOutletMenuSchema,
  updateOutletMenuSchema,
} from "./outletMenu.validation";

export const outletMenuRoutes = Router({ mergeParams: true });

outletMenuRoutes.post(
  "/",
  validate(assignOutletMenuSchema),
  asyncHandler(outletMenuController.assignMenuItem)
);

outletMenuRoutes.get(
  "/",
  validate(listOutletMenuSchema),
  asyncHandler(outletMenuController.listOutletMenu)
);

outletMenuRoutes.patch(
  "/:menuItemId",
  validate(updateOutletMenuSchema),
  asyncHandler(outletMenuController.updateOutletMenu)
);

outletMenuRoutes.delete(
  "/:menuItemId",
  validate(removeOutletMenuSchema),
  asyncHandler(outletMenuController.removeOutletMenu)
);
