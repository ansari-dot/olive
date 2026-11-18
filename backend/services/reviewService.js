import mongoose from "mongoose";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { invalidateCache } from "../middlewares/cache.js";
import { parsePagination } from "../utils/pagination.js";

const toObjectId = (id) =>
  typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;

function bustProductCaches() {
  invalidateCache("/api/products");
  invalidateCache("/api/home");
}

/**
 * Recalculate average rating + review count on the product after any review
 * mutation. Returns the new aggregate values.
 */
export async function recalculateProductRating(productId) {
  const objectId = toObjectId(productId);
  const stats = await Review.aggregate([
    { $match: { productId: objectId, status: "approved" } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    const avgRating = stats[0].avgRating;
    const totalReviews = stats[0].totalReviews;
    const updated = await Product.findByIdAndUpdate(
      productId,
      {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews,
        rating: Math.round(avgRating),
        reviews: totalReviews,
      },
      { new: true }
    );
    return {
      averageRating: updated?.averageRating || 0,
      totalReviews: updated?.totalReviews || 0,
    };
  }

  await Product.findByIdAndUpdate(productId, {
    averageRating: 0,
    totalReviews: 0,
    rating: 0,
    reviews: 0,
  });
  return { averageRating: 0, totalReviews: 0 };
}

export async function addReview(body) {
  const { productId, orderId, customerName, customerEmail, rating, reviewText } = body;

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound("Order not found");

  if (order.customer?.email !== customerEmail) {
    throw ApiError.forbidden("You can only review products you purchased");
  }

  const productInOrder = order.items.some(
    (item) => String(item.productId) === String(productId)
  );
  if (!productInOrder) {
    throw ApiError.forbidden("You can only review products you purchased");
  }

  const existingReview = await Review.findOne({
    productId,
    orderId,
    customerEmail,
  });
  if (existingReview) {
    throw ApiError.badRequest("You have already reviewed this product");
  }

  const review = await Review.create({
    productId,
    orderId,
    customerName,
    customerEmail,
    rating,
    reviewText,
    isVerifiedPurchase: true,
  });

  const productStats = await recalculateProductRating(productId);
  bustProductCaches();

  return { review, productStats };
}

export async function listProductReviews(productId, query = {}) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 10 });

  const [reviews, totalReviews, ratingStats, avgRatingAgg] = await Promise.all([
    Review.find({ productId, status: "approved" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ productId, status: "approved" }),
    Review.aggregate([
      { $match: { productId: toObjectId(productId), status: "approved" } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
    Review.aggregate([
      { $match: { productId: toObjectId(productId), status: "approved" } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]),
  ]);

  return {
    reviews,
    totalReviews,
    currentPage: page,
    totalPages: Math.ceil(totalReviews / limit),
    ratingStats,
    averageRating: avgRatingAgg[0]?.avgRating || 0,
  };
}

export async function canReviewProduct({ productId, customerEmail }) {
  const orders = await Order.find({
    "customer.email": customerEmail,
    "items.productId": productId,
  });

  if (orders.length === 0) {
    return {
      canReview: false,
      message: "You must purchase this product to review it",
    };
  }

  const existing = await Review.findOne({ productId, customerEmail });
  if (existing) {
    return {
      canReview: false,
      message: "You have already reviewed this product",
    };
  }

  const customerName =
    `${orders[0].customer?.firstName || ""} ${orders[0].customer?.lastName || ""}`.trim() ||
    "Customer";

  return {
    canReview: true,
    orderId: orders[0]._id,
    customerName,
    message: "You can review this product",
  };
}

export async function markReviewHelpful(reviewId) {
  const review = await Review.findByIdAndUpdate(
    reviewId,
    { $inc: { helpful: 1 } },
    { new: true }
  );
  if (!review) throw ApiError.notFound("Review not found");
  return { message: "Review marked as helpful", helpful: review.helpful };
}
