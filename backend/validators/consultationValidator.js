import { z } from "zod";
import { objectIdSchema, emailSchema, paginationSchema } from "./common.js";

const CONSULTATION_TYPES = [
  "curtains",
  "blinds",
  "upholstery",
  "interior",
  "commercial",
];
const URGENCY_VALUES = ["flexible", "1-month", "2-weeks", "urgent"];
const STATUS_VALUES = ["pending", "confirmed", "completed", "cancelled"];
const BUDGET_VALUES = [
  "",
  "under-25k",
  "25k-50k",
  "50k-100k",
  "100k-200k",
  "200k-plus",
];

export const createConsultationSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: emailSchema,
    phone: z.string().trim().min(1, "Phone is required"),
    address: z.string().trim().min(1, "Address is required"),
    consultationType: z.enum(CONSULTATION_TYPES, {
      message: "Valid consultation type is required",
    }),
    preferredDate: z.coerce.date({
      message: "Preferred date is required",
    }),
    preferredTime: z.string().trim().min(1, "Preferred time is required"),
    projectDetails: z.string().optional().default(""),
    budget: z.enum(BUDGET_VALUES).optional().default(""),
    urgency: z.enum(URGENCY_VALUES).optional().default("flexible"),
    status: z.enum(STATUS_VALUES).optional().default("pending"),
    submittedAt: z.coerce.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.preferredDate && data.preferredDate <= new Date()) {
      ctx.addIssue({
        code: "custom",
        path: ["preferredDate"],
        message: "Preferred date must be in the future",
      });
    }
  });

export const consultationListQuerySchema = paginationSchema;

export const updateConsultationStatusSchema = z.object({
  status: z.enum(STATUS_VALUES),
  notes: z.string().optional().default(""),
});

export const consultationIdParamSchema = z.object({ id: objectIdSchema });
