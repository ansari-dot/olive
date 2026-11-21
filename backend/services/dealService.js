import mongoose from "mongoose";
import Deal from "../models/Deal.js";
import Product from "../models/Product.js";
import { invalidateCache } from "../middlewares/cache.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Fetches all currently active running deals with populated product details
 */
export async function getActiveDeals() {
  const now = new Date();
  return await Deal.find({
    isActive: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
    $expr: {
      $or: [
        { $eq: ["$dealStockLimit", 0] },
        { $lt: ["$dealSoldCount", "$dealStockLimit"] },
      ],
    },
  })
    .populate("product", "name price image slug category stock soldCount size")
    .sort({ endsAt: 1 })
    .lean();
}

/**
 * Ensures no overlapping active/scheduled deals exist for the same product
 */
export async function validateNoOverlappingDeal(productId, startsAt, endsAt, excludeDealId = null) {
  const query = {
    product: productId,
    isActive: true,
    startsAt: { $lt: new Date(endsAt) },
    endsAt: { $gt: new Date(startsAt) },
  };

  if (excludeDealId) {
    query._id = { $ne: excludeDealId };
  }

  const overlap = await Deal.findOne(query).lean();
  if (overlap) {
    const startStr = new Date(overlap.startsAt).toLocaleDateString("en-PK");
    const endStr = new Date(overlap.endsAt).toLocaleDateString("en-PK");
    throw ApiError.badRequest(
      `An active or scheduled deal already exists for this product (${startStr} – ${endStr}). Please modify or disable the existing deal first.`
    );
  }
}

/**
 * Calculates deal price and discount percentage accurately
 */
export function calculateDealPricing(originalPrice, discountType, discountValue) {
  const base = Number(originalPrice);
  if (isNaN(base) || base <= 0) {
    throw ApiError.badRequest("Valid original product price is required");
  }

  let dealPrice = 0;
  let discountPercent = 0;

  if (discountType === "percent") {
    const percent = Math.round(Number(discountValue));
    if (isNaN(percent) || percent < 1 || percent > 99) {
      throw ApiError.badRequest("Discount percentage must be between 1% and 99%");
    }
    discountPercent = percent;
    dealPrice = Math.round(base * (1 - percent / 100));
  } else if (discountType === "fixed_price") {
    const fixed = Math.round(Number(discountValue));
    if (isNaN(fixed) || fixed <= 0 || fixed >= base) {
      throw ApiError.badRequest(
        `Deal price must be greater than Rs. 0 and less than original price (Rs. ${base.toLocaleString("en-PK")})`
      );
    }
    dealPrice = fixed;
    discountPercent = Math.round(((base - fixed) / base) * 100);
  } else {
    throw ApiError.badRequest("Invalid discount type. Must be 'percent' or 'fixed_price'");
  }

  return { dealPrice, discountPercent };
}

/**
 * Create a new time-bound deal
 */
export async function createDeal(payload) {
  const {
    productId,
    title = "Flash Deal",
    description = "",
    discountType = "percent",
    discountValue,
    startsAt = new Date(),
    endsAt,
    dealBadge,
    dealStockLimit = 0,
    isActive = true,
  } = payload;

  if (!productId) {
    throw ApiError.badRequest("Product ID is required for a deal");
  }

  if (!endsAt) {
    throw ApiError.badRequest("Deal expiration date and time (endsAt) is required");
  }

  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw ApiError.badRequest("Invalid start or end date format");
  }

  if (endDate <= startDate) {
    throw ApiError.badRequest("Deal expiration date must be after the start date");
  }

  // 1. Verify product in catalog
  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound("Product not found in catalog");
  }

  // Always use product's authentic base price to preserve original values
  const originalPrice = product.price;

  // 2. Calculate deal price and discount percentage
  const { dealPrice, discountPercent } = calculateDealPricing(
    originalPrice,
    discountType,
    discountValue
  );

  // 3. Prevent overlapping deals for this product
  if (isActive) {
    await validateNoOverlappingDeal(product._id, startDate, endDate);
  }

  const badge = dealBadge?.trim() ? dealBadge.trim() : `-${discountPercent}%`;

  // 4. Create deal record
  const deal = await Deal.create({
    product: product._id,
    title: title.trim(),
    description: description.trim(),
    discountType,
    discountValue: Number(discountValue),
    originalPrice,
    dealPrice,
    discountPercent,
    dealBadge: badge,
    startsAt: startDate,
    endsAt: endDate,
    isActive: Boolean(isActive),
    dealStockLimit: Math.max(0, parseInt(dealStockLimit, 10) || 0),
    dealSoldCount: 0,
  });

  // Invalidate caches so storefront immediately shows new active deal
  invalidateCache("/api/deals");
  invalidateCache("/api/products");
  invalidateCache("/api/home");
  invalidateCache("/api/deal-section");

  return deal;
}

/**
 * Update an existing deal
 */
export async function updateDeal(dealId, payload) {
  const deal = await Deal.findById(dealId);
  if (!deal) {
    throw ApiError.notFound("Deal record not found");
  }

  const product = await Product.findById(deal.product);
  if (!product) {
    throw ApiError.notFound("Associated product not found");
  }

  const originalPrice = product.price;
  const startDate = payload.startsAt ? new Date(payload.startsAt) : deal.startsAt;
  const endDate = payload.endsAt ? new Date(payload.endsAt) : deal.endsAt;

  if (endDate <= startDate) {
    throw ApiError.badRequest("Deal expiration date must be after start date");
  }

  const discountType = payload.discountType || deal.discountType;
  const discountValue =
    payload.discountValue !== undefined ? payload.discountValue : deal.discountValue;

  const { dealPrice, discountPercent } = calculateDealPricing(
    originalPrice,
    discountType,
    discountValue
  );

  const isActive = payload.isActive !== undefined ? Boolean(payload.isActive) : deal.isActive;

  if (isActive) {
    await validateNoOverlappingDeal(deal.product, startDate, endDate, deal._id);
  }

  deal.title = payload.title !== undefined ? payload.title.trim() : deal.title;
  deal.description = payload.description !== undefined ? payload.description.trim() : deal.description;
  deal.discountType = discountType;
  deal.discountValue = Number(discountValue);
  deal.originalPrice = originalPrice;
  deal.dealPrice = dealPrice;
  deal.discountPercent = discountPercent;
  deal.dealBadge = payload.dealBadge !== undefined
    ? (payload.dealBadge.trim() || `-${discountPercent}%`)
    : (deal.dealBadge || `-${discountPercent}%`);
  deal.startsAt = startDate;
  deal.endsAt = endDate;
  deal.isActive = isActive;
  if (payload.dealStockLimit !== undefined) {
    deal.dealStockLimit = Math.max(0, parseInt(payload.dealStockLimit, 10) || 0);
  }

  await deal.save();

  invalidateCache("/api/deals");
  invalidateCache("/api/products");
  invalidateCache("/api/home");
  invalidateCache("/api/deal-section");

  return deal;
}

/**
 * Toggle deal active state
 */
export async function toggleDealActive(dealId, isActive) {
  const deal = await Deal.findById(dealId);
  if (!deal) {
    throw ApiError.notFound("Deal record not found");
  }

  const nextActive = Boolean(isActive);
  if (nextActive) {
    await validateNoOverlappingDeal(deal.product, deal.startsAt, deal.endsAt, deal._id);
  }

  deal.isActive = nextActive;
  await deal.save();

  invalidateCache("/api/deals");
  invalidateCache("/api/products");
  invalidateCache("/api/home");
  invalidateCache("/api/deal-section");

  return deal;
}

/**
 * Delete a deal
 */
export async function deleteDeal(dealId) {
  const deal = await Deal.findByIdAndDelete(dealId);
  if (!deal) {
    throw ApiError.notFound("Deal record not found");
  }

  invalidateCache("/api/deals");
  invalidateCache("/api/products");
  invalidateCache("/api/home");
  invalidateCache("/api/deal-section");

  return { success: true, message: "Deal deleted successfully" };
}

/**
 * List all deals for admin panel with populated products and computed status
 */
export async function listAdminDeals(query = {}) {
  const filter = {};
  if (query.productId) {
    filter.product = query.productId;
  }
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true" || query.isActive === true;
  }

  const deals = await Deal.find(filter)
    .populate("product", "name price image slug category stock soldCount")
    .sort({ createdAt: -1 })
    .lean();

  const now = new Date();
  const enriched = deals.map((d) => {
    let status = "active";
    if (!d.isActive) {
      status = "disabled";
    } else if (d.dealStockLimit > 0 && d.dealSoldCount >= d.dealStockLimit) {
      status = "sold_out";
    } else if (now < new Date(d.startsAt)) {
      status = "scheduled";
    } else if (now > new Date(d.endsAt)) {
      status = "expired";
    } else {
      status = "active";
    }

    return {
      ...d,
      status,
    };
  });

  return enriched;
}

/**
 * Look up active running deals for given product IDs (or all active deals)
 */
export async function getActiveDealsMap(productIds = [], now = new Date()) {
  const query = {
    isActive: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
  };

  if (Array.isArray(productIds) && productIds.length > 0) {
    query.product = { $in: productIds.map((id) => new mongoose.Types.ObjectId(String(id))) };
  }

  const deals = await Deal.find(query).lean();
  const map = new Map();

  for (const deal of deals) {
    // If quota reached, skip (sold out)
    if (deal.dealStockLimit > 0 && deal.dealSoldCount >= deal.dealStockLimit) {
      continue;
    }
    map.set(String(deal.product), deal);
  }

  return map;
}

/**
 * Server-side deal resolver: safely attaches active deal prices, badges, and countdown timers to a single product object
 */
export function applyDealToProduct(product, deal) {
  if (!product) return product;
  const p = product.toObject ? product.toObject({ virtuals: true }) : { ...product };

  if (!deal) {
    p.isDeal = false;
    p.dealBadge = null;
    p.discountPercent = null;
    p.dealEndsAt = null;
    p.dealStartsAt = null;
    p.dealId = null;
    p.dealStockLimit = null;
    p.dealSoldCount = null;
    p.dealRemainingStock = null;
    p.originalPrice = null;
    p.isSale = false;
    return p;
  }

  // Preserve true regular price as originalPrice
  p.originalPrice = p.price;
  p.price = deal.dealPrice;
  p.discountPercent = deal.discountPercent;
  p.dealBadge = deal.dealBadge || `-${deal.discountPercent}%`;
  p.dealEndsAt = deal.endsAt;
  p.dealStartsAt = deal.startsAt;
  p.isDeal = true;
  p.isSale = true;
  p.dealId = String(deal._id);
  p.dealStockLimit = deal.dealStockLimit || 0;
  p.dealSoldCount = deal.dealSoldCount || 0;
  p.dealRemainingStock =
    deal.dealStockLimit > 0 ? Math.max(0, deal.dealStockLimit - deal.dealSoldCount) : null;

  return p;
}

/**
 * Server-side deal resolver: applies active deals to an array of products
 */
export async function applyDealsToProducts(products = [], now = new Date()) {
  if (!Array.isArray(products) || products.length === 0) {
    return products;
  }

  const ids = products.map((p) => p._id || p.id).filter(Boolean);
  const dealsMap = await getActiveDealsMap(ids, now);

  return products.map((prod) => {
    const prodId = String(prod._id || prod.id);
    const deal = dealsMap.get(prodId);
    return applyDealToProduct(prod, deal);
  });
}

/**
 * Retrieves the currently active deal for a product (used during order price verification)
 */
export async function getActiveDealForProduct(productId, now = new Date()) {
  if (!productId) return null;
  const cleanId = String(productId);
  const map = await getActiveDealsMap([cleanId], now);
  return map.get(cleanId) || null;
}

/**
 * Atomically increments deal sold count during order placement
 */
export async function incrementDealSoldAtomic(dealId, quantity = 1) {
  if (!dealId || !quantity) return null;
  return await Deal.findByIdAndUpdate(
    dealId,
    { $inc: { dealSoldCount: quantity } },
    { new: true }
  );
}
