import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as menuItemController from "./menuItem.controller";
import {
  createMenuItemSchema,
  menuItemIdParamSchema,
  updateMenuItemSchema,
} from "./menuItem.validation";

export const menuItemRoutes = Router();

menuItemRoutes.post(
  "/",
  validate(createMenuItemSchema),
  asyncHandler(menuItemController.createMenuItem)
);

menuItemRoutes.get("/", asyncHandler(menuItemController.listMenuItems));

menuItemRoutes.get(
  "/:menuItemId",
  validate(menuItemIdParamSchema),
  asyncHandler(menuItemController.getMenuItemById)
);

menuItemRoutes.patch(
  "/:menuItemId",
  validate(updateMenuItemSchema),
  asyncHandler(menuItemController.updateMenuItem)
);

menuItemRoutes.delete(
  "/:menuItemId",
  validate(menuItemIdParamSchema),
  asyncHandler(menuItemController.deleteMenuItem)
);
