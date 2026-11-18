import Review from "../models/Review.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

async function recalculateRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
    {
      $group: {
        _id: "$product",
        count: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  const reviewsCount = stats[0]?.count || 0;
  const rating = reviewsCount > 0 ? Math.round(stats[0].avgRating) : 5;
  await Product.findByIdAndUpdate(productId, { rating, reviewsCount });
}

// Public: POST /api/reviews
export const addReview = asyncHandler(async (req, res) => {
  const { productId, author, rating, comment } = req.body;
  if (!productId || !author || !rating || !comment) {
    throw ApiError.badRequest("productId, author, rating, and comment are required");
  }

  const review = await Review.create({
    product: productId,
    author: author.trim(),
    rating: Number(rating),
    comment: comment.trim(),
    isApproved: true,
  });

  await recalculateRating(productId);
  res.status(201).json({ success: true, review, data: review });
});

// Public: GET /api/reviews/product/:productId
export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    product: req.params.productId,
    isApproved: true,
  }).sort({ createdAt: -1 });
  res.json({ success: true, reviews, data: reviews });
});

// Public: GET /api/reviews/can-review
export const canReviewProduct = asyncHandler(async (_req, res) => {
  res.json({ canReview: true });
});

// Public: PUT /api/reviews/:reviewId/helpful
export const markHelpful = asyncHandler(async (req, res) => {
  res.json({ success: true });
});

// Admin: GET /api/admin/reviews
export const getAdminReviews = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.isApproved !== undefined) {
    filter.isApproved = req.query.isApproved === "true";
  }

  const reviews = await Review.find(filter)
    .populate("product", "name sku slug image")
    .sort({ createdAt: -1 });

  res.json({ success: true, reviews, data: reviews });
});

// Admin: PATCH /api/admin/reviews/:id/moderate
export const moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound("Review not found");

  if (req.body.isApproved !== undefined) {
    review.isApproved = req.body.isApproved;
  } else {
    review.isApproved = !review.isApproved;
  }
  await review.save();
  await recalculateRating(review.product);

  res.json({
    success: true,
    message: `Review ${review.isApproved ? "approved" : "hidden"}`,
    review,
    data: review,
  });
});

// Admin: DELETE /api/admin/reviews/:id
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw ApiError.notFound("Review not found");

  await recalculateRating(review.product);
  res.json({ success: true, message: "Review deleted successfully" });
});
