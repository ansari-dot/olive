import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import EmailOutbox from "../models/EmailOutbox.js";
import { validateCoupon } from "./couponService.js";
import { getActiveDealForProduct } from "./dealService.js";
import {
  reserveOrderInventory,
  rollbackInventory,
  restoreOrderInventory,
  restockReturnedUnits,
} from "./inventoryService.js";
import { getCourierAdapter } from "./courier/courierFactory.js";
import {
  queueOrderConfirmationEmail,
  queueShipmentDispatchedEmail,
} from "./emailService.js";
import { buildPayfastPayloadForOrder } from "./payfastService.js";
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

/**
 * Creates a new order with atomic inventory reservation and idempotency guarantee.
 *
 * @param {Object} payload - Order data from client
 * @param {string|null} idempotencyKey - Optional idempotency key from header or body
 */
export async function createOrder(payload, idempotencyKey = null) {
  const { customer, shippingAddress, items, paymentMethod, couponCode } = payload;

  // 1. Idempotency Check: Prevent duplicate order processing
  const cleanIdempotencyKey = (
    idempotencyKey ||
    payload.idempotencyKey ||
    payload.idempotency_key
  )?.trim() || null;

  if (cleanIdempotencyKey) {
    const existingOrder = await Order.findOne({ idempotencyKey: cleanIdempotencyKey });
    if (existingOrder) {
      let payfastData = null;
      if (
        existingOrder.paymentMethod === "PayFast (Sandbox)" ||
        existingOrder.paymentMethod === "PayFast"
      ) {
        payfastData = buildPayfastPayloadForOrder(existingOrder);
      }
      return {
        order: existingOrder,
        payfast: payfastData,
        bankDetails:
          existingOrder.paymentMethod === "Bank Transfer (IBFT)"
            ? IBFT_BANK_DETAILS
            : null,
        isDuplicate: true,
      };
    }
  }

  // 2. Strict Input Validation
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
    ![
      "Cash on Delivery",
      "PayFast (Sandbox)",
      "PayFast",
      "Bank Transfer (IBFT)",
    ].includes(paymentMethod)
  ) {
    throw ApiError.badRequest(
      "Payment method must be 'Cash on Delivery' or 'PayFast (Sandbox)'"
    );
  }

  // 3. Authoritative Price & Product Lookup directly from MongoDB (Zero Client Trust)
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

    // Server-side authoritative deal resolver
    const activeDeal = await getActiveDealForProduct(dbProduct._id);
    const effectivePrice = activeDeal ? activeDeal.dealPrice : dbProduct.price;

    const lineTotal = effectivePrice * qty;
    subtotal += lineTotal;

    // Snapshot of historical prices at order time
    resolvedItems.push({
      product: dbProduct._id,
      slug: dbProduct.slug,
      name: dbProduct.name,
      size: dbProduct.size,
      image: dbProduct.image,
      price: effectivePrice,
      originalPrice: dbProduct.price,
      isDeal: Boolean(activeDeal),
      dealId: activeDeal ? activeDeal._id : undefined,
      discountPercent: activeDeal ? activeDeal.discountPercent : 0,
      quantity: qty,
      lineTotal,
    });
  }

  // 4. Coupon validation if provided (excluding deal items)
  let discountAmount = 0;
  let appliedCouponCode = null;

  if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
    const regularItems = resolvedItems.filter((it) => !it.isDeal);
    const regularSubtotal = regularItems.reduce((acc, it) => acc + it.lineTotal, 0);
    const dealItems = resolvedItems.filter((it) => it.isDeal);

    if (regularItems.length === 0 && dealItems.length > 0) {
      throw ApiError.badRequest(
        "Coupon codes cannot be applied to Flash Deal items. Your cart contains only promotional deal products."
      );
    }

    try {
      const couponRes = await validateCoupon({
        code: couponCode.trim(),
        subtotal: regularSubtotal,
        totalSubtotal: subtotal,
        hasDealItems: dealItems.length > 0,
      });
      discountAmount = couponRes.discountAmount;
      appliedCouponCode = couponRes.code;
    } catch (err) {
      throw ApiError.badRequest(
        `Coupon error: ${err.message || "Invalid coupon code"}`
      );
    }
  }

  // 5. Shipping fee & total calculation
  const effectiveSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingFee = effectiveSubtotal >= 1200 || effectiveSubtotal === 0 ? 0 : 200;
  const total = effectiveSubtotal + shippingFee;

  const orderReference = await generateUniqueOrderReference();
  const courierTrackingCode = `TCS-${orderReference.replace("ZP-", "")}90`;
  const paymentStatus =
    paymentMethod === "Bank Transfer (IBFT)"
      ? "awaiting_ibft"
      : paymentMethod.includes("PayFast")
      ? "pending_payfast"
      : "pending_cod";

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
      note: "Cold-Packed & Sealed — Cushioned in insulated light-shielded sleeves",
      updatedBy: "System",
      timestamp: now,
    },
  ];

  // 6. ATOMIC INVENTORY RESERVATION (Prevents negative inventory, concurrent exhaustion, deal stock overshoot)
  const reservation = await reserveOrderInventory(resolvedItems);

  // 7. Create Order Document with Compensation Rollback Guard
  let order;
  try {
    const orderDocData = {
      orderReference,
      inventoryState: "deducted",
      courierName: "TCS Express",
      courierTrackingCode,
      shipment: {
        provider: "mock",
        trackingNumber: courierTrackingCode,
        trackingUrl: "",
        labelUrl: "",
        parcelWeightKg: 0.5,
        codAmount: paymentMethod === "Cash on Delivery" ? total : 0,
        status: "unshipped",
        shipmentAttempts: [],
      },
      returnDetails: {
        status: "none",
      },
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
    };

    if (cleanIdempotencyKey) {
      orderDocData.idempotencyKey = cleanIdempotencyKey;
    }

    order = await Order.create(orderDocData);
  } catch (createErr) {
    // If order creation document fails, ROLLBACK reserved stock immediately!
    await rollbackInventory(reservation.reservedItems);
    throw createErr;
  }

  // 8. Increment coupon usage atomically
  if (appliedCouponCode) {
    try {
      await Coupon.findOneAndUpdate(
        { code: appliedCouponCode },
        { $inc: { usedCount: 1 } }
      );
    } catch {
      // non-blocking
    }
  }

  // 9. Transactional Email Outbox Queueing (Non-blocking, never rolls back order)
  queueOrderConfirmationEmail(order);

  invalidateCache("/api/products");
  invalidateCache("/api/deals");

  let payfastData = null;
  if (
    paymentMethod === "PayFast (Sandbox)" ||
    paymentMethod === "PayFast"
  ) {
    payfastData = buildPayfastPayloadForOrder(order, {
      clientUrl: payload?.clientUrl,
    });
  }

  return {
    order,
    payfast: payfastData,
    bankDetails:
      paymentMethod === "Bank Transfer (IBFT)" ? IBFT_BANK_DETAILS : null,
  };
}

export async function updateOrderPaymentMethod(orderReference, newPaymentMethod) {
  if (!orderReference || typeof orderReference !== "string") {
    throw ApiError.badRequest("Order reference is required");
  }

  const cleanRef = orderReference.trim().toUpperCase();
  const order = await Order.findOne({ orderReference: cleanRef });
  if (!order) {
    throw ApiError.notFound(`Order ${cleanRef} not found`);
  }

  if (order.paymentStatus === "paid") {
    throw ApiError.badRequest(`Order ${cleanRef} is already marked as paid`);
  }

  if (newPaymentMethod === "Cash on Delivery") {
    order.paymentMethod = "Cash on Delivery";
    order.paymentStatus = "pending_cod";
    if (order.shipment) {
      order.shipment.codAmount = order.total;
    }
    order.statusHistory.push({
      stage: order.trackingStage,
      orderStatus: order.orderStatus,
      note: "Customer switched payment method to Cash on Delivery (COD)",
      updatedBy: "Customer",
      timestamp: new Date(),
    });
    await order.save();
    return {
      success: true,
      message: "Order updated to Cash on Delivery successfully",
      order,
    };
  }

  if (newPaymentMethod === "PayFast (Sandbox)" || newPaymentMethod === "PayFast") {
    order.paymentMethod = "PayFast (Sandbox)";
    order.paymentStatus = "pending_payfast";
    if (order.shipment) {
      order.shipment.codAmount = 0;
    }
    order.statusHistory.push({
      stage: order.trackingStage,
      orderStatus: order.orderStatus,
      note: "Customer selected PayFast checkout",
      updatedBy: "Customer",
      timestamp: new Date(),
    });
    await order.save();
    const payfast = buildPayfastPayloadForOrder(order);
    return {
      success: true,
      message: "PayFast payment initialized",
      order,
      payfast,
    };
  }

  throw ApiError.badRequest(`Unsupported payment method: ${newPaymentMethod}`);
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
      title: `In Transit via ${order.courierName || "Courier Express"}`,
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
    courierTrackingCode: order.shipment?.trackingNumber || order.courierTrackingCode,
    trackingUrl: order.shipment?.trackingUrl || "",
    labelUrl: order.shipment?.labelUrl || "",
    shipmentStatus: order.shipment?.status || "unshipped",
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
    returnDetails: order.returnDetails,
    createdAt: order.createdAt,
  };
}

export async function listAdminOrders(query = {}) {
  const filter = {};

  if (query.orderStatus && query.orderStatus !== "all") {
    filter.orderStatus = query.orderStatus;
  }
  if (query.paymentMethod && query.paymentMethod !== "all") {
    filter.paymentMethod = query.paymentMethod;
  }
  if (query.paymentStatus && query.paymentStatus !== "all") {
    filter.paymentStatus = query.paymentStatus;
  }
  if (query.courierProvider && query.courierProvider !== "all") {
    filter["shipment.provider"] = query.courierProvider.toLowerCase();
  }
  if (query.shipmentStatus && query.shipmentStatus !== "all") {
    filter["shipment.status"] = query.shipmentStatus;
  }
  if (query.city && typeof query.city === "string" && query.city !== "all") {
    filter["shippingAddress.city"] = new RegExp(escapeRegex(query.city.trim()), "i");
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (query.search && typeof query.search === "string" && query.search.trim()) {
    const s = query.search.trim();
    const regex = new RegExp(escapeRegex(s), "i");
    filter.$or = [
      { orderReference: regex },
      { courierTrackingCode: regex },
      { "shipment.trackingNumber": regex },
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
    returned: 0,
  };

  const summaryMap = {
    confirmed: "Order Confirmed — Harvest Batch Verified at Islamabad Hub",
    cold_packed: "Cold-Packed & Sealed — Preparing Parcel at Islamabad Hub",
    dispatched: `In Transit via ${order.courierName || "Courier Express"} — Linehaul En Route`,
    out_for_delivery: `Out for Delivery — ${order.courierName || "Courier"} Rider En Route`,
    delivered: "Delivered — Signed by Recipient",
    cancelled: "Order Cancelled",
    returned: "Order Returned — Received at Hub",
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
    if (order.shipment) {
      order.shipment.status = "delivered";
      order.shipment.deliveredAt = new Date();
    }
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

/**
 * Initiates an official consignment shipment with selected courier provider.
 */
export async function initiateShipment(orderReference, payload = {}, adminUser) {
  const cleanRef = orderReference.trim().toUpperCase();
  const order = await Order.findOne({ orderReference: cleanRef });
  if (!order) throw ApiError.notFound(`Order ${cleanRef} not found`);

  if (order.orderStatus === "cancelled") {
    throw ApiError.badRequest("Cannot dispatch a cancelled order");
  }
  if (order.orderStatus === "delivered") {
    throw ApiError.badRequest("Order has already been marked delivered");
  }

  const providerName = (
    payload.provider ||
    order.shipment?.provider ||
    "tcs"
  ).toLowerCase();

  const parcelWeightKg = Math.max(0.1, Number(payload.parcelWeightKg) || 0.5);
  const codAmount =
    order.paymentMethod === "Cash on Delivery" && order.paymentStatus !== "paid"
      ? order.total
      : 0;

  const adapter = getCourierAdapter(providerName);

  let shipmentResult;
  try {
    shipmentResult = await adapter.createShipment({
      order,
      parcelWeightKg,
      codAmount,
      remarks: payload.remarks || order.shippingAddress.notes || "",
    });
  } catch (err) {
    order.shipment.shipmentAttempts.push({
      provider: providerName,
      action: "createShipment",
      requestPayload: { parcelWeightKg, codAmount },
      responsePayload: null,
      error: err.message,
      timestamp: new Date(),
    });
    await order.save();
    throw ApiError.badRequest(`Courier Booking Failed: ${err.message}`);
  }

  const courierCompanyNames = {
    tcs: "TCS Express",
    leopards: "Leopards Courier",
    trax: "Trax Logistics",
    mnp: "M&P Express Logistics",
    mock: "Express Delivery (Sandbox)",
  };

  const displayName = courierCompanyNames[providerName] || "Courier Express";

  order.shipment.provider = providerName;
  order.shipment.trackingNumber = shipmentResult.trackingNumber;
  order.shipment.trackingUrl = shipmentResult.trackingUrl || "";
  order.shipment.labelUrl = shipmentResult.labelUrl || "";
  order.shipment.parcelWeightKg = parcelWeightKg;
  order.shipment.codAmount = codAmount;
  order.shipment.status = "manifested";
  order.shipment.dispatchedAt = new Date();
  order.shipment.shipmentAttempts.push({
    provider: providerName,
    action: "createShipment",
    requestPayload: { parcelWeightKg, codAmount },
    responsePayload: shipmentResult.rawResponse,
    error: null,
    timestamp: new Date(),
  });

  order.courierName = displayName;
  order.courierTrackingCode = shipmentResult.trackingNumber;
  order.orderStatus = "dispatched";
  order.trackingStage = 3;
  order.statusSummary = `In Transit via ${displayName} — Tracking ID: ${shipmentResult.trackingNumber}`;
  if (shipmentResult.estimatedDelivery) {
    order.estimatedDelivery = shipmentResult.estimatedDelivery;
  }

  order.statusHistory.push({
    stage: 3,
    orderStatus: "dispatched",
    note: `Shipment booked with ${displayName} (Tracking ID: ${shipmentResult.trackingNumber})`,
    updatedBy: adminUser?.name || "Admin",
    timestamp: new Date(),
  });

  await order.save();

  // Queue shipment dispatched email non-blockingly
  queueShipmentDispatchedEmail(order);

  return order;
}

/**
 * Synchronize real-time tracking status from courier provider.
 */
export async function syncCourierStatus(orderReference, adminUser = null) {
  const cleanRef = orderReference.trim().toUpperCase();
  const order = await Order.findOne({ orderReference: cleanRef });
  if (!order) throw ApiError.notFound(`Order ${cleanRef} not found`);

  const trackingNumber =
    order.shipment?.trackingNumber || order.courierTrackingCode;

  if (!trackingNumber) {
    throw ApiError.badRequest("No tracking code assigned to this order");
  }

  const adapter = getCourierAdapter(order.shipment?.provider || "mock");
  const trackResult = await adapter.trackShipment(trackingNumber);

  // Status mapping
  const statusMap = {
    manifested: "cold_packed",
    in_transit: "dispatched",
    out_for_delivery: "out_for_delivery",
    delivered: "delivered",
    returned: "returned",
  };

  const newStatus = statusMap[trackResult.status] || order.orderStatus;
  const stageHierarchy = {
    confirmed: 1,
    cold_packed: 2,
    dispatched: 3,
    out_for_delivery: 4,
    delivered: 5,
  };

  // Monotonic progression: Never downgrade order status automatically
  const currentLevel = stageHierarchy[order.orderStatus] || 0;
  const newLevel = stageHierarchy[newStatus] || 0;

  if (newLevel > currentLevel) {
    order.orderStatus = newStatus;
    order.trackingStage = Math.min(4, newLevel);
    if (order.shipment) {
      order.shipment.status = trackResult.status;
      if (trackResult.status === "delivered") {
        order.shipment.deliveredAt = new Date();
        if (order.paymentMethod === "Cash on Delivery") {
          order.paymentStatus = "paid";
        }
      }
    }
    order.statusHistory.push({
      stage: order.trackingStage,
      orderStatus: order.orderStatus,
      note: `Synced from ${order.courierName}: ${trackResult.events?.[0]?.message || trackResult.status}`,
      updatedBy: adminUser?.name || "Courier Webhook / Sync",
      timestamp: new Date(),
    });

    await order.save();
  }

  return { order, trackResult };
}

export async function updateOrderTracking(orderReference, payload, adminUser) {
  const cleanRef = orderReference.trim().toUpperCase();
  const order = await Order.findOne({ orderReference: cleanRef });
  if (!order) throw ApiError.notFound(`Order ${cleanRef} not found`);

  if (payload.courierName) order.courierName = payload.courierName.trim();
  if (payload.courierTrackingCode) {
    order.courierTrackingCode = payload.courierTrackingCode.trim();
    if (order.shipment) {
      order.shipment.trackingNumber = order.courierTrackingCode;
    }
  }
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

/**
 * Cancels an order safely and restores product stock atomically.
 */
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

  // Atomically RESTORE product inventory and deal quotas
  await restoreOrderInventory(order, order.cancelReason, adminUser?.name || "Admin");

  await order.save();
  return order;
}

/**
 * Handles return inspection, approval and inventory restocking.
 */
export async function processReturn(orderReference, payload, adminUser) {
  const cleanRef = orderReference.trim().toUpperCase();
  const order = await Order.findOne({ orderReference: cleanRef });
  if (!order) throw ApiError.notFound(`Order ${cleanRef} not found`);

  const { action, reason, inspectionNotes, restockQuantity } = payload;

  if (action === "request") {
    order.returnDetails.status = "requested";
    order.returnDetails.reason = reason || "Customer requested return";
    order.statusHistory.push({
      stage: order.trackingStage,
      orderStatus: order.orderStatus,
      note: `Return requested: ${order.returnDetails.reason}`,
      updatedBy: adminUser?.name || "Customer",
      timestamp: new Date(),
    });
    await order.save();
    return order;
  }

  if (action === "inspect") {
    order.returnDetails.status = "inspected";
    order.returnDetails.inspectedBy = adminUser?.name || "Admin";
    order.returnDetails.inspectedAt = new Date();
    order.returnDetails.auditNote = inspectionNotes || "Goods physical condition inspected";
    order.statusHistory.push({
      stage: order.trackingStage,
      orderStatus: order.orderStatus,
      note: `Return inspected by ${order.returnDetails.inspectedBy}: ${order.returnDetails.auditNote}`,
      updatedBy: adminUser?.name || "Admin",
      timestamp: new Date(),
    });
    await order.save();
    return order;
  }

  if (action === "approve_and_restock") {
    await restockReturnedUnits(order, restockQuantity, inspectionNotes, adminUser);
    order.orderStatus = "returned";
    order.trackingStage = 0;
    order.statusSummary = "Order Returned & Goods Restocked in Warehouse";
    order.statusHistory.push({
      stage: 0,
      orderStatus: "returned",
      note: `Return approved & restocked (${order.returnDetails.restockedQuantity} units) by ${adminUser?.name || "Admin"}`,
      updatedBy: adminUser?.name || "Admin",
      timestamp: new Date(),
    });
    await order.save();
    return order;
  }

  if (action === "reject") {
    order.returnDetails.status = "rejected";
    order.returnDetails.auditNote = inspectionNotes || "Return rejected after inspection";
    order.statusHistory.push({
      stage: order.trackingStage,
      orderStatus: order.orderStatus,
      note: `Return rejected: ${order.returnDetails.auditNote}`,
      updatedBy: adminUser?.name || "Admin",
      timestamp: new Date(),
    });
    await order.save();
    return order;
  }

  throw ApiError.badRequest(`Invalid return action: ${action}`);
}

export async function deleteAllOrders() {
  const result = await Order.deleteMany({});
  await EmailOutbox.deleteMany({});
  return {
    success: true,
    message: `All ${result.deletedCount} orders deleted successfully`,
    deletedCount: result.deletedCount,
  };
}

export async function deleteOrder(orderReference) {
  const cleanRef = String(orderReference || "").trim().toUpperCase();
  const deleted = await Order.findOneAndDelete({ orderReference: cleanRef });
  if (!deleted) {
    throw ApiError.notFound(`Order ${cleanRef} not found`);
  }
  return {
    success: true,
    message: `Order ${cleanRef} deleted successfully`,
  };
}
