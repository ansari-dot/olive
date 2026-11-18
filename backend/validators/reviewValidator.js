import { z } from "zod";
import { objectIdSchema, emailSchema, paginationSchema } from "./common.js";

export const addReviewSchema = z.object({
  productId: objectIdSchema,
  orderId: objectIdSchema,
  customerName: z.string().trim().min(1, "Name is required"),
  customerEmail: emailSchema,
  rating: z.coerce.number().int().min(1).max(5),
  reviewText: z.string().trim().min(1, "Review is required").max(1000),
});

export const productIdParamSchema = z.object({ productId: objectIdSchema });

export const reviewIdParamSchema = z.object({ reviewId: objectIdSchema });

export const canReviewQuerySchema = z.object({
  productId: objectIdSchema,
  customerEmail: emailSchema,
});

export const productReviewsQuerySchema = paginationSchema;
