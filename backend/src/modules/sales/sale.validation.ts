import { z } from "zod";

const optionalQuery = z
  .record(z.string(), z.union([z.string(), z.array(z.string())]))
  .optional();

export const createSaleSchema = z.object({
  params: z.object({
    outletId: z.uuid(),
  }),
  body: z.object({
    items: z
      .array(
        z.object({
          menuItemId: z.uuid(),
          quantity: z.coerce
            .number({ message: "Quantity must be a positive integer" })
            .int()
            .positive(),
        })
      )
      .min(1, "Sale must have at least one item"),
  }),
  query: optionalQuery,
});

export const listSalesSchema = z.object({
  params: z.object({
    outletId: z.uuid(),
  }),
  body: z.unknown(),
  query: optionalQuery,
});

export const getSaleSchema = z.object({
  params: z.object({
    outletId: z.uuid(),
    saleId: z.uuid(),
  }),
  body: z.unknown(),
  query: optionalQuery,
});

export type CreateSaleBody = z.infer<typeof createSaleSchema>["body"];
