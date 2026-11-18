import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/u, "Invalid id");

export const idParamSchema = z.object({ id: objectIdSchema });

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Invalid email address");

export default { objectIdSchema, idParamSchema, paginationSchema, emailSchema };
