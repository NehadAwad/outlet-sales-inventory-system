import { z } from "zod";

const outletCodeRegex = /^[A-Za-z0-9_-]+$/;

export const createOutletSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(150),
    code: z.string().trim().min(1).max(50).regex(outletCodeRegex),
    address: z.union([z.string().trim().max(2000), z.null()]).optional(),
  }),
  params: z.record(z.string(), z.string()),
  query: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
});

export const updateOutletSchema = z.object({
  params: z.object({
    outletId: z.string().uuid(),
  }),
  body: z
    .object({
      name: z.string().trim().min(1).max(150).optional(),
      address: z.union([z.string().trim().max(2000), z.null()]).optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (data) =>
        data.name !== undefined ||
        data.address !== undefined ||
        data.isActive !== undefined,
      { message: "At least one field is required" }
    ),
  query: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
});

export const outletIdParamSchema = z.object({
  params: z.object({
    outletId: z.string().uuid(),
  }),
  body: z.unknown(),
  query: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
});

export type CreateOutletBody = z.infer<typeof createOutletSchema>["body"];
export type UpdateOutletBody = z.infer<typeof updateOutletSchema>["body"];
