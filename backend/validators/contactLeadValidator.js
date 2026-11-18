import { z } from "zod";
import { emailSchema, paginationSchema } from "./common.js";

export const createContactLeadSchema = z.object({
  firstName: z.string().trim().min(1, "firstName is required"),
  lastName: z.string().trim().min(1, "lastName is required"),
  email: emailSchema,
  phone: z.string().optional().default(""),
  topic: z.string().optional().default(""),
  message: z.string().trim().min(1, "message is required"),
});

export const contactLeadListQuerySchema = paginationSchema;
