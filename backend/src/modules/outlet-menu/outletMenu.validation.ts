import { z } from "zod";

const moneyField = z.coerce
  .number({ message: "price must be a positive decimal number" })
  .positive()
  .max(99_999_999.99)
  .transform((n) => (Math.round(n * 100) / 100).toFixed(2));

const optionalQuery = z
  .record(z.string(), z.union([z.string(), z.array(z.string())]))
  .optional();

export const assignOutletMenuSchema = z.object({
  params: z.object({
    outletId: z.uuid(),
  }),
  body: z.object({
    menuItemId: z.uuid(),
    price: moneyField,
  }),
  query: optionalQuery,
});

export const listOutletMenuSchema = z.object({
  params: z.object({
    outletId: z.uuid(),
  }),
  body: z.unknown(),
  query: optionalQuery,
});

export const updateOutletMenuSchema = z.object({
  params: z.object({
    outletId: z.uuid(),
    menuItemId: z.uuid(),
  }),
  body: z
    .object({
      price: moneyField.optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (data) => data.price !== undefined || data.isActive !== undefined,
      { message: "At least one field is required" }
    ),
  query: optionalQuery,
});

export const removeOutletMenuSchema = z.object({
  params: z.object({
    outletId: z.uuid(),
    menuItemId: z.uuid(),
  }),
  body: z.unknown(),
  query: optionalQuery,
});

export type AssignOutletMenuBody = z.infer<typeof assignOutletMenuSchema>["body"];
export type UpdateOutletMenuBody = z.infer<typeof updateOutletMenuSchema>["body"];
