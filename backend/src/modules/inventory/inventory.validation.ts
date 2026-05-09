import { z } from "zod";

const optionalQuery = z
  .record(z.string(), z.union([z.string(), z.array(z.string())]))
  .optional();

const stockQtyField = z.coerce
  .number({ message: "stockQty must be a non-negative integer" })
  .int()
  .min(0);

export const createInventorySchema = z.object({
  params: z.object({
    outletId: z.uuid(),
  }),
  body: z.object({
    menuItemId: z.uuid(),
    stockQty: stockQtyField,
  }),
  query: optionalQuery,
});

export const listInventorySchema = z.object({
  params: z.object({
    outletId: z.uuid(),
  }),
  body: z.unknown(),
  query: optionalQuery,
});

export const updateInventorySchema = z.object({
  params: z.object({
    outletId: z.uuid(),
    menuItemId: z.uuid(),
  }),
  body: z.object({
    stockQty: stockQtyField,
  }),
  query: optionalQuery,
});

export type CreateInventoryBody = z.infer<typeof createInventorySchema>["body"];
export type UpdateInventoryBody = z.infer<typeof updateInventorySchema>["body"];
