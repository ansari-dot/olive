import { z } from "zod";
import { objectIdSchema } from "./common.js";

const baseCouponBody = z.object({
  code: z.string().trim().min(1, "Code is required"),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().nonnegative(),
  appliesToAll: z.coerce.boolean().optional(),
  productIds: z.array(objectIdSchema).optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  active: z.coerce.boolean().optional(),
  usageCount: z.coerce.number().int().nonnegative().optional(),
  // `null` (or omitted) → unlimited. Any positive integer caps total redemptions.
  usageLimit: z.coerce.number().int().positive().nullable().optional(),
});

export const createCouponSchema = baseCouponBody;
export const updateCouponSchema = baseCouponBody.partial();
export const couponIdParamSchema = z.object({ id: objectIdSchema });
