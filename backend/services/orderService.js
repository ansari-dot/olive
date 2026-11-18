import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { validateCoupon } from "./couponService.js";
import { invalidateCache } from "../middlewares/cache.js";
import { escapeRegex } from "../utils/security.js";
import { ApiError } from "../utils/ApiError.js";

const IBFT_BANK_DETAILS = {
  bankName: "Meezan Bank Limited",
  accountTitle: "Zaitoon Pakistan (Pvt) Ltd",
  accountNumber: "02010108923481",
  iban: "PK36MEZN0002010108923481",
  branch: "F-7 Markaz Branch, Islamabad",
  instructions:
    "Please transfer the exact total amount and send your payment screenshot/reference number with your Order ID to payments@zaitoonpakistan.pk or WhatsApp at 0300-ZAITOON (0300-9248666).",
};

export async function generateUniqueOrderReference() {
  for (let attempts = 0; attempts < 10; attempts++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const ref = `ZP-${num}`;
    const exists = await Order.findOne({ orderReference: ref });
    if (!exists) return ref;
  }
  return `ZP-${Date.now().toString().slice(-4)}`;
}

export const makeOrderCode = generateUniqueOrderReference;

export async function createOrder(payload) {
  const { customer, shippingAddress, items, paymentMethod, couponCode } = payload;

  if (!customer?.name || !customer?.phone) {
    throw ApiError.badRequest("Customer name and phone number are required");
  }

  if (!shippingAddress?.city || !shippingAddress?.address) {
    throw ApiError.badRequest("Shipping city and street address are required");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest("Order must contain at least one product item");
  }

  if (
    !paymentMethod ||
    !["Cash on Delivery", "Bank Transfer (IBFT)"].includes(paymentMethod)
  ) {
    throw ApiError.badRequest(
      "Payment method must be 'Cash on Delivery' or 'Bank Transfer (IBFT)'"
    );
  }

  // 1. Authoritative lookup & stock validation from MongoDB
  const resolvedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const productId = item.productId || item.product || item.id || item._id;
    const qty = Math.max(1, parseInt(item.quantity || item.qty || 1, 10));

    let dbProduct = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      dbProduct = await Product.findById(productId);
    }
    if (!dbProduct && item.slug) {
      dbProduct = await Product.findOne({ slug: item.slug.toLowerCase() });
    }
    if (!dbProduct && typeof productId === "string") {
      dbProduct = await Product.findOne({ slug: productId.toLowerCase() });
    }

    if (!dbProduct) {
      throw ApiError.badRequest(`Product "${productId}" not found in inventory`);
    }

    if (!dbProduct.isActive) {
      throw ApiError.badRequest(`Product "${dbProduct.name}" is currently unavailable`);
    }

    if (dbProduct.stock < qty) {
      throw ApiError.badRequest(
        `Insufficient stock for "${dbProduct.name}". Available: ${dbProduct.stock}, requested: ${qty}`
      );
    }

    const lineTotal = dbProduct.price * qty;
    subtotal += lineTotal;

    resolvedItems.push({
      product: dbProduct._id,
      slug: dbProduct.slug,
      name: dbProduct.name,
      size: dbProduct.size,
      image: dbProduct.image,
      price: dbProduct.price,
      quantity: qty,
      lineTotal,
    });
  }

  // 2. Coupon validation if provided
  let discountAmount = 0;
  let appliedCouponCode = null;

  if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
    try {
      const couponRes = await validateCoupon({
        code: couponCode.trim(),
        subtotal,
      });
      discountAmount = couponRes.discountAmount;
      appliedCouponCode = couponRes.code;
    } catch (err) {
      throw ApiError.badRequest(
        `Coupon error: ${err.message || "Invalid coupon code"}`
      );
    }
  }

  // 3. Shipping fee & total calculation
  const effectiveSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingFee = effectiveSubtotal >= 1200 || effectiveSubtotal === 0 ? 0 : 200;
  const total = effectiveSubtotal + shippingFee;

  const orderReference = await generateUniqueOrderReference();
  const courierTrackingCode = `TCS-${orderReference.replace("ZP-", "")}90`;
  const paymentStatus =
    paymentMethod === "Bank Transfer (IBFT)" ? "awaiting_ibft" : "pending_cod";

  // 4. Initial status and tracking stage
  const now = new Date();
  const initialHistory = [
    {
      stage: 1,
      orderStatus: "confirmed",
      note: "Order Confirmed — Harvest batch verified at Islamabad Orchard Hub",
      updatedBy: "System",
      timestamp: now,
    },
    {
      stage: 2,
      orderStatus: "cold_packed",
      note: "Cold-Packed & Sealed — Cushioned in insulated light-shielded bottle sleeves",
      updatedBy: "System",
      timestamp: now,
    },
  ];

  // 5. Create Order
  const order = await Order.create({
    orderReference,
    courierName: "TCS Express",
    courierTrackingCode,
    customer: {
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      email: customer.email ? customer.email.trim().toLowerCase() : "",
    },
    shippingAddress: {
      city: shippingAddress.city.trim(),
      area: shippingAddress.area ? shippingAddress.area.trim() : "",
      address: shippingAddress.address.trim(),
      notes: shippingAddress.notes ? shippingAddress.notes.trim() : "",
    },
    items: resolvedItems,
    paymentMethod,
    paymentStatus,
    couponCode: appliedCouponCode,
    subtotal,
    discountAmount,
    shippingFee,
    total,
    orderStatus: "cold_packed",
    trackingStage: 2,
    statusSummary: "Cold-Packed & Sealed — Preparing Parcel at Islamabad Hub",
    estimatedDelivery: "2–3 working days via TCS Express",
    statusHistory: initialHistory,
  });

  // 6. Atomically deduct stock & increment soldCount
  for (const item of resolvedItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: {
        stock: -item.quantity,
        soldCount: item.quantity,
      },
    });
  }

  // 7. Increment coupon usedCount
  if (appliedCouponCode) {
    await Coupon.findOneAndUpdate(
      { code: appliedCouponCode },
      { $inc: { usedCount: 1 } }
    );
  }

  invalidateCache("/api/products");

  return {
    order,
    bankDetails:
      paymentMethod === "Bank Transfer (IBFT)" ? IBFT_BANK_DETAILS : null,
  };
}

export async function trackOrder(orderReference) {
  if (!orderReference || typeof orderReference !== "string") {
    throw ApiError.badRequest("Order reference is required");
  }

  const cleanRef = orderReference.trim().toUpperCase();
  const order = await Order.findOne({ orderReference: cleanRef });

  if (!order) {
    throw ApiError.notFound(
      `No tracking record found for order reference "${cleanRef}". Please check your order ID.`
    );
  }

  const timeline = [
    {
      stage: 1,
      title: "Order Confirmed",
      detail:
        "Harvest batch verified at our Chakwal Road Orchard Hub, Islamabad.",
      completed: order.trackingStage >= 1,
    },
    {
      stage: 2,
      title: "Cold-Packed & Sealed",
      detail:
        "Dark-glass bottles cushioned in protective insulated sleeves.",
      completed: order.trackingStage >= 2,
    },
    {
      stage: 3,
      title: "In Transit via TCS Express",
      detail:
        "Linehaul parcel travelling to your destination city dispatch hub.",
      completed: order.trackingStage >= 3,
    },
    {
      stage: 4,
      title: "Out for Delivery / Delivered",
      detail:
        "Rider en route for doorstep handover and Cash on Delivery collection.",
      completed: order.trackingStage >= 4,
    },
  ];

  return {
    orderReference: order.orderReference,
    courierName: order.courierName,
    courierTrackingCode: order.courierTrackingCode,
    customerName: order.customer.name,
    city: order.shippingAddress.city,
    address: order.shippingAddress.address,
    items: order.items,
    itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    shippingFee: order.shippingFee,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    trackingStage: order.trackingStage,
    statusSummary: order.statusSummary,
    estimatedDelivery: order.estimatedDelivery,
    timeline,
    statusHistory: order.statusHistory,
    createdAt: order.createdAt,
  };
}

export async function listAdminOrders(query = {}) {
  const filter = {};

  if (query.orderStatus) filter.orderStatus = query.orderStatus;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.city && typeof query.city === "string") {
    filter["shippingAddress.city"] = new RegExp(escapeRegex(query.city.trim()), "i");
  }

  if (query.search && typeof query.search === "string" && query.search.trim()) {
    const s = query.search.trim();
    const regex = new RegExp(escapeRegex(s), "i");
    filter.$or = [
      { orderReference: regex },
      { courierTrackingCode: regex },
      { "customer.name": regex },
      { "customer.phone": regex },
      { "customer.email": regex },
      { "shippingAddress.city": regex },
    ];
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getAdminOrderByRef(orderReference) {
  const cleanRef = orderReference.trim().toUpperCase();
  const order = await Order.findOne({ orderReference: cleanRef });
  if (!order) throw ApiError.notFound(`Order ${cleanRef} not found`);
  return order;
}

export async function updateOrderStatus(orderReference, { orderStatus, note }, adminUser) {
  const cleanRef = orderReference.trim().toUpperCase();
  const order = await Order.findOne({ orderReference: cleanRef });
  if (!order) throw ApiError.notFound(`Order ${cleanRef} not found`);

  const stageMap = {
    confirmed: 1,
    cold_packed: 2,
    dispatched: 3,
    out_for_delivery: 4,
    delivered: 4,
    cancelled: 0,
  };

  const summaryMap = {
    confirmed: "Order Confirmed — Harvest Batch Verified at Islamabad Hub",
    cold_packed: "Cold-Packed & Sealed — Preparing Parcel at Islamabad Hub",
    dispatched: "In Transit via TCS Express — Linehaul En Route",
    out_for_delivery: "Out for Delivery — TCS Rider En Route",
    delivered: "Delivered — Signed by Recipient",
    cancelled: "Order Cancelled",
  };

  if (!stageMap.hasOwnProperty(orderStatus)) {
    throw ApiError.badRequest(`Invalid order status: ${orderStatus}`);
  }

  order.orderStatus = orderStatus;
  order.trackingStage = stageMap[orderStatus];
  order.statusSummary = summaryMap[orderStatus] || orderStatus;

  // Auto-mark COD paid on delivery if not already paid
  if (orderStatus === "delivered" && order.paymentMethod === "Cash on Delivery") {
    order.paymentStatus = "paid";
  }

  const historyEntry = {
    stage: order.trackingStage,
    orderStatus,
    note: note || order.statusSummary,
    updatedBy: adminUser?.name || "Admin",
    timestamp: new Date(),
  };

  order.statusHistory.push(historyEntry);
  await order.save();

  return order;
}

export async function updateOrderTracking(orderReference, payload, adminUser) {
  const cleanRef = orderReference.trim().toUpperCase();
  const order = await Order.findOne({ orderReference: cleanRef });
  if (!order) throw ApiError.notFound(`Order ${cleanRef} not found`);

  if (payload.courierName) order.courierName = payload.courierName.trim();
  if (payload.courierTrackingCode) order.courierTrackingCode = payload.courierTrackingCode.trim();
  if (payload.estimatedDelivery) order.estimatedDelivery = payload.estimatedDelivery.trim();

  order.statusHistory.push({
    stage: order.trackingStage,
    orderStatus: order.orderStatus,
    note: `Tracking updated: ${order.courierName} (${order.courierTrackingCode || "N/A"})`,
    updatedBy: adminUser?.name || "Admin",
    timestamp: new Date(),
  });

  await order.save();
  return order;
}

export async function updateOrderPayment(orderReference, payload, adminUser) {
  const cleanRef = orderReference.trim().toUpperCase();
  const order = await Order.findOne({ orderReference: cleanRef });
  if (!order) throw ApiError.notFound(`Order ${cleanRef} not found`);

  if (payload.paymentStatus) order.paymentStatus = payload.paymentStatus;
  if (payload.ibftReference) order.ibftReference = payload.ibftReference.trim();

  order.statusHistory.push({
    stage: order.trackingStage,
    orderStatus: order.orderStatus,
    note: `Payment status updated to "${order.paymentStatus}"${
      order.ibftReference ? ` (Ref: ${order.ibftReference})` : ""
    }`,
    updatedBy: adminUser?.name || "Admin",
    timestamp: new Date(),
  });

  await order.save();
  return order;
}

export async function cancelOrder(orderReference, { cancelReason }, adminUser) {
  const cleanRef = orderReference.trim().toUpperCase();
  const order = await Order.findOne({ orderReference: cleanRef });
  if (!order) throw ApiError.notFound(`Order ${cleanRef} not found`);

  if (order.orderStatus === "delivered") {
    throw ApiError.badRequest("Cannot cancel an order that has already been delivered");
  }

  if (order.orderStatus === "cancelled") {
    return order;
  }

  order.orderStatus = "cancelled";
  order.trackingStage = 0;
  order.cancelReason = cancelReason || "Cancelled by administrator";
  order.statusSummary = `Order Cancelled: ${order.cancelReason}`;

  order.statusHistory.push({
    stage: 0,
    orderStatus: "cancelled",
    note: `Cancelled: ${order.cancelReason}`,
    updatedBy: adminUser?.name || "Admin",
    timestamp: new Date(),
  });

  await order.save();

  // Atomically RESTORE Product stock & decrement soldCount
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: {
        stock: item.quantity,
        soldCount: -item.quantity,
      },
    });
  }

  // Atomically decrement Coupon usedCount
  if (order.couponCode) {
    await Coupon.findOneAndUpdate(
      { code: order.couponCode },
      { $inc: { usedCount: -1 } }
    );
  }

  invalidateCache("/api/products");

  return order;
}
