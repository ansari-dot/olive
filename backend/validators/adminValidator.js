import { z } from "zod";
import { objectIdSchema, emailSchema, paginationSchema } from "./common.js";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(40)
  .regex(/^[a-z0-9_.-]+$/u, "Username can only contain letters, numbers, _ . -");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200);

const roleSchema = z.enum(["admin", "super_admin"]);

export const createAdminSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  name: z.string().trim().optional().default(""),
  password: passwordSchema,
  role: roleSchema.optional(),
  active: z.coerce.boolean().optional(),
});

// Update schema: every field optional, but if `password` is supplied it must
// still meet the strength rule.
export const updateAdminSchema = z
  .object({
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
    name: z.string().trim().optional(),
    password: passwordSchema.optional(),
    role: roleSchema.optional(),
    active: z.coerce.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const adminIdParamSchema = z.object({ id: objectIdSchema });

export const adminListQuerySchema = paginationSchema;
