import * as reviewService from "../services/reviewService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Public: POST /api/reviews
export const addReview = asyncHandler(async (req, res) => {
  const review = await reviewService.addReview(req.body);
  return ApiResponse.created(res, { review, data: review });
});

// Public: GET /api/reviews/product/:productId
export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getProductReviews(req.params.productId);
  return ApiResponse.success(res, { reviews, data: reviews });
});

// Public: GET /api/reviews/can-review
export const canReviewProduct = asyncHandler(async (_req, res) => {
  return ApiResponse.success(res, { canReview: true });
});

// Public: PUT /api/reviews/:reviewId/helpful
export const markHelpful = asyncHandler(async (_req, res) => {
  return ApiResponse.success(res, {});
});

// Admin: GET /api/admin/reviews
export const getAdminReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getAdminReviews(req.query);
  return ApiResponse.success(res, { reviews, data: reviews });
});

// Admin: PATCH /api/admin/reviews/:id/moderate
export const moderateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.moderateReview(req.params.id, req.body.isApproved);
  return ApiResponse.success(
    res,
    { review, data: review },
    `Review ${review.isApproved ? "approved" : "hidden"}`
  );
});

// Admin: DELETE /api/admin/reviews/:id
export const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.id);
  return ApiResponse.success(res, {}, "Review deleted successfully");
});
