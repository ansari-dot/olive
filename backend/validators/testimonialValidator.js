import { z } from "zod";
import { objectIdSchema } from "./common.js";

const baseTestimonialBody = z.object({
  name: z.string().trim().min(1, "Name is required"),
  role: z.string().optional(),
  quote: z.string().trim().min(1, "Quote is required"),
  img: z.string().optional(),
  active: z.coerce.boolean().optional(),
});

export const createTestimonialSchema = baseTestimonialBody;
export const updateTestimonialSchema = baseTestimonialBody.partial();

export const testimonialListQuerySchema = z.object({
  active: z.enum(["true", "false"]).optional(),
});

export const testimonialIdParamSchema = z.object({ id: objectIdSchema });
