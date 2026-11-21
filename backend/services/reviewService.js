import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { invalidateCache } from "../middlewares/cache.js";

const toObjectId = (id) =>
  typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;

function bustProductCaches() {
  invalidateCache("/api/products");
  invalidateCache("/api/home");
}

export async function recalculateProductRating(productId) {
  const objectId = toObjectId(productId);
  const stats = await Review.aggregate([
    { $match: { product: objectId, isApproved: true } },
    {
      $group: {
        _id: "$product",
        count: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const reviewsCount = stats[0]?.count || 0;
  const rawAvg = stats[0]?.avgRating || 5;
  const rating = reviewsCount > 0 ? Math.round(rawAvg * 10) / 10 : 5;

  await Product.findByIdAndUpdate(productId, { rating, reviewsCount });
  bustProductCaches();

  return { rating, reviewsCount };
}

export async function addReview({ productId, author, rating, comment, email, city, orderReference }) {
  if (!productId || !author || !rating || !comment) {
    throw ApiError.badRequest("productId, author, rating, and comment are required");
  }

  const review = await Review.create({
    product: productId,
    author: String(author).trim(),
    email: email ? String(email).trim().toLowerCase() : "buyer@pakveda.pk",
    city: city ? String(city).trim() : "",
    rating: Number(rating),
    comment: String(comment).trim(),
    orderReference: orderReference ? String(orderReference).trim().toUpperCase() : null,
    verifiedPurchase: Boolean(orderReference),
    isApproved: true,
  });

  await recalculateProductRating(productId);
  return review;
}

export async function getProductReviews(productId) {
  return await Review.find({
    product: productId,
    isApproved: true,
  }).sort({ createdAt: -1 });
}

export async function getAdminReviews(filterParams = {}) {
  const filter = {};
  if (filterParams.isApproved !== undefined) {
    filter.isApproved = filterParams.isApproved === "true" || filterParams.isApproved === true;
  }

  return await Review.find(filter)
    .populate("product", "name sku slug image price")
    .sort({ createdAt: -1 });
}

export async function moderateReview(id, isApprovedOverride = undefined) {
  const review = await Review.findById(id);
  if (!review) throw ApiError.notFound("Review not found");

  if (isApprovedOverride !== undefined) {
    review.isApproved = Boolean(isApprovedOverride);
  } else {
    review.isApproved = !review.isApproved;
  }

  await review.save();
  await recalculateProductRating(review.product);
  return review;
}

export async function deleteReview(id) {
  const review = await Review.findByIdAndDelete(id);
  if (!review) throw ApiError.notFound("Review not found");

  await recalculateProductRating(review.product);
  return review;
}
