import { z } from "zod";

const ALLOWED_DAYS = [7, 30, 90, 180, 365];

export const reportsQuerySchema = z.object({
  days: z.coerce
    .number()
    .int()
    .refine((v) => ALLOWED_DAYS.includes(v), {
      message: `days must be one of: ${ALLOWED_DAYS.join(", ")}`,
    })
    .optional(),
});
