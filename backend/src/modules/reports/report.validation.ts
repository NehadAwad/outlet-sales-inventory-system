import { z } from "zod";

const optionalQuery = z
  .record(z.string(), z.union([z.string(), z.array(z.string())]))
  .optional();

/** GET /reports/revenue-by-outlet — no route params */
export const revenueByOutletSchema = z.object({
  params: z.record(z.string(), z.string()),
  body: z.unknown(),
  query: optionalQuery,
});

export const topSellingItemsParamSchema = z.object({
  params: z.object({
    outletId: z.uuid(),
  }),
  body: z.unknown(),
  query: optionalQuery,
});
