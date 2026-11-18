import { z } from "zod";
import { emailSchema, paginationSchema } from "./common.js";

export const createSubscriberSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: emailSchema,
  source: z.string().optional(),
});

export const subscriberListQuerySchema = paginationSchema;
