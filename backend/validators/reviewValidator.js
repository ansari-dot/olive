import { z } from "zod";
import { objectIdSchema, emailSchema, paginationSchema } from "./common.js";

export const addReviewSchema = z.object({
  productId: objectIdSchema,
  orderId: objectIdSchema.optional(),
  customerName: z.string().trim().min(1).optional(),
  author: z.string().trim().min(1).optional(),
  customerEmail: emailSchema.optional(),
  email: emailSchema.optional(),
  rating: z.coerce.number().int().min(1).max(5),
  reviewText: z.string().trim().min(1).max(2000).optional(),
  comment: z.string().trim().min(1).max(2000).optional(),
});

export const productIdParamSchema = z.object({ productId: objectIdSchema });

export const reviewIdParamSchema = z.object({ reviewId: objectIdSchema });

export const canReviewQuerySchema = z.object({
  productId: objectIdSchema,
  customerEmail: emailSchema,
});

export const productReviewsQuerySchema = paginationSchema;
