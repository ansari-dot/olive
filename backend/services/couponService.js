import Coupon from "../models/Coupon.js";
import Product from "../models/Product.js";
import { getActiveDealsMap } from "./dealService.js";
import { ApiError } from "../utils/ApiError.js";

export async function validateCoupon({
  code,
  subtotal,
  items = [],
  totalSubtotal = null,
  hasDealItems = false,
}) {
  if (!code || typeof code !== "string" || !code.trim()) {
    throw ApiError.badRequest("Coupon code is required");
  }

  const rawSubtotal = Number(subtotal);
  if (isNaN(rawSubtotal) || rawSubtotal < 0) {
    throw ApiError.badRequest("Valid subtotal in PKR is required");
  }

  const cleanCode = code.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: cleanCode });

  if (!coupon) {
    throw ApiError.badRequest(`Coupon code "${cleanCode}" is invalid`);
  }

  if (!coupon.isActive) {
    throw ApiError.badRequest(`Coupon code "${cleanCode}" is inactive`);
  }

  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
    throw ApiError.badRequest(`Coupon code "${cleanCode}" has expired`);
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest(`Coupon code "${cleanCode}" usage limit has been reached`);
  }

  let eligibleSubtotal = rawSubtotal;
  let dealItemsExcluded = Boolean(hasDealItems);

  // If item list is provided, filter out active deal products dynamically
  if (Array.isArray(items) && items.length > 0) {
    const productIds = items
      .map((it) => it.productId || it.product || it.id || it._id)
      .filter(Boolean);
    const dealsMap = await getActiveDealsMap(productIds);

    let regSubtotal = 0;
    let dealSubtotal = 0;
    let dealCount = 0;
    let regCount = 0;

    for (const it of items) {
      const pId = String(it.productId || it.product || it.id || it._id);
      const qty = Math.max(1, parseInt(it.quantity || it.qty || 1, 10));
      const isDeal = dealsMap.has(pId) || Boolean(it.isDeal);

      // Lookup real product price
      let unitPrice = Number(it.price || 0);
      if (dealsMap.has(pId)) {
        unitPrice = dealsMap.get(pId).dealPrice;
      } else if (!unitPrice) {
        const dbProd = await Product.findById(pId).lean();
        if (dbProd) unitPrice = dbProd.price;
      }

      const lineTotal = unitPrice * qty;

      if (isDeal) {
        dealSubtotal += lineTotal;
        dealCount += qty;
      } else {
        regSubtotal += lineTotal;
        regCount += qty;
      }
    }

    if (dealCount > 0 && regCount === 0) {
      throw ApiError.badRequest(
        "Coupon codes cannot be applied to Flash Deal items. Your cart contains only promotional deal products."
      );
    }

    if (dealCount > 0) {
      eligibleSubtotal = regSubtotal;
      dealItemsExcluded = true;
    }
  }

  if (eligibleSubtotal < (coupon.minOrderAmount || 0)) {
    throw ApiError.badRequest(
      `Coupon "${cleanCode}" requires a minimum eligible regular order amount of Rs. ${(coupon.minOrderAmount || 0).toLocaleString("en-PK")}`
    );
  }

  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round((eligibleSubtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else {
    discountAmount = Math.min(eligibleSubtotal, coupon.discountValue);
  }

  const overallSubtotal =
    totalSubtotal !== null && !isNaN(Number(totalSubtotal))
      ? Number(totalSubtotal)
      : rawSubtotal;
  const effectiveSubtotal = Math.max(0, overallSubtotal - discountAmount);
  const shippingFee = effectiveSubtotal >= 1200 || effectiveSubtotal === 0 ? 0 : 200;
  const finalTotal = effectiveSubtotal + shippingFee;

  let message = coupon.description || "Harvest coupon applied";
  if (dealItemsExcluded) {
    message = `${message} (Applied only to eligible regular items; Flash Deal items excluded)`;
  }

  return {
    valid: true,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    shippingFee,
    finalTotal,
    eligibleSubtotal,
    dealItemsExcluded,
    message,
  };
}

export async function applyCouponToItems(code, items = []) {
  const subtotal = items.reduce((s, i) => s + (i.price || i.unitPrice || 0) * (i.quantity || i.qty || 1), 0);
  const res = await validateCoupon({ code, subtotal });
  return {
    discount: res.discountAmount,
    coupon: { code: res.code, discountType: res.discountType, discountValue: res.discountValue },
  };
}

export async function redeemCouponByCode(code) {
  if (!code) return;
  await Coupon.findOneAndUpdate({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
}

const ALLOWED_COUPON_FIELDS = [
  "code",
  "description",
  "discountType",
  "discountValue",
  "minOrderAmount",
  "maxDiscountAmount",
  "startDate",
  "expiresAt",
  "usageLimit",
  "isActive",
];

function pickCouponPayload(input) {
  const clean = {};
  for (const field of ALLOWED_COUPON_FIELDS) {
    if (input[field] !== undefined) {
      clean[field] = input[field];
    }
  }
  return clean;
}

export async function listCoupons() {
  return await Coupon.find().sort({ createdAt: -1 });
}

export async function createCoupon(inputPayload) {
  const payload = pickCouponPayload(inputPayload);
  if (!payload.code || !payload.discountValue) {
    throw ApiError.badRequest("Coupon code and discountValue are required");
  }
  payload.code = String(payload.code).trim().toUpperCase();

  const existing = await Coupon.findOne({ code: payload.code });
  if (existing) {
    throw ApiError.badRequest(`Coupon "${payload.code}" already exists`);
  }

  return await Coupon.create(payload);
}

export async function updateCoupon(id, inputPayload) {
  const payload = pickCouponPayload(inputPayload);
  if (payload.code) {
    payload.code = String(payload.code).trim().toUpperCase();
  }
  const coupon = await Coupon.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!coupon) throw ApiError.notFound("Coupon not found");
  return coupon;
}

export async function toggleCoupon(id) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw ApiError.notFound("Coupon not found");
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  return coupon;
}

export async function deleteCoupon(id) {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw ApiError.notFound("Coupon not found");
  return { success: true, message: "Coupon deleted successfully" };
}
