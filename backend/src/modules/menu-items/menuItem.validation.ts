import { z } from "zod";

const skuRegex = /^[A-Za-z0-9._-]+$/;

const moneyField = z.coerce
  .number({ message: "basePrice must be a positive decimal number" })
  .positive()
  .max(99_999_999.99)
  .transform((n) => (Math.round(n * 100) / 100).toFixed(2));

export const createMenuItemSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(150),
    sku: z.string().trim().min(1).max(80).regex(skuRegex),
    description: z.union([z.string().trim().max(5000), z.null()]).optional(),
    basePrice: moneyField,
  }),
  params: z.record(z.string(), z.string()),
  query: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
});

export const updateMenuItemSchema = z.object({
  params: z.object({
    menuItemId: z.string().uuid(),
  }),
  body: z
    .object({
      name: z.string().trim().min(1).max(150).optional(),
      sku: z.string().trim().min(1).max(80).regex(skuRegex).optional(),
      description: z.union([z.string().trim().max(5000), z.null()]).optional(),
      basePrice: moneyField.optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (data) =>
        data.name !== undefined ||
        data.sku !== undefined ||
        data.description !== undefined ||
        data.basePrice !== undefined ||
        data.isActive !== undefined,
      { message: "At least one field is required" }
    ),
  query: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
});

export const menuItemIdParamSchema = z.object({
  params: z.object({
    menuItemId: z.string().uuid(),
  }),
  body: z.unknown(),
  query: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
});

export type CreateMenuItemBody = z.infer<typeof createMenuItemSchema>["body"];
export type UpdateMenuItemBody = z.infer<typeof updateMenuItemSchema>["body"];
