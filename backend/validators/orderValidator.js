import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "../models/Order.js";

// Re-exporting the canonical lists so callers (frontend codegen, tests,
// dashboards) can import them from here without reaching into the model.
export { ORDER_STATUSES, PAYMENT_STATUSES };

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
});

export const orderCodeParamSchema = z.object({
  code: z.string().trim().min(1, "Order code is required"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});
