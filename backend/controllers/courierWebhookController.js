import Order from "../models/Order.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";

// Status level hierarchy for monotonic progression
const STAGE_HIERARCHY = {
  confirmed: 1,
  cold_packed: 2,
  dispatched: 3,
  out_for_delivery: 4,
  delivered: 5,
};

/**
 * Normalizes courier webhook status strings into internal system states.
 */
function normalizeCourierStatus(rawStatus) {
  if (!rawStatus) return "in_transit";
  const s = String(rawStatus).toLowerCase().trim().replace(/[\s_-]+/g, "");

  if (s.includes("deliver") || s.includes("dlv") || s.includes("signed")) {
    return "delivered";
  }
  if (s.includes("outfor") || s.includes("ofd") || s.includes("courierout")) {
    return "out_for_delivery";
  }
  if (
    s.includes("transit") ||
    s.includes("dispatched") ||
    s.includes("linehaul") ||
    s.includes("picked") ||
    s.includes("origin")
  ) {
    return "dispatched";
  }
  if (s.includes("manifest") || s.includes("booked") || s.includes("bagged")) {
    return "cold_packed";
  }
  if (s.includes("return") || s.includes("rto")) {
    return "returned";
  }
  return "dispatched";
}

export const handleCourierWebhook = asyncHandler(async (req, res) => {
  const provider = (req.params.provider || req.body.provider || "courier").toLowerCase();
  const signature = req.headers["x-courier-signature"] || req.query.secret;

  // Verify webhook secret if configured
  if (env.COURIER.WEBHOOK_SECRET && signature) {
    if (signature !== env.COURIER.WEBHOOK_SECRET) {
      return res.status(401).json({ success: false, message: "Invalid webhook signature" });
    }
  }

  const payload = req.body || {};
  const trackingNumber =
    payload.trackingNumber ||
    payload.tracking_number ||
    payload.consignmentNo ||
    payload.consignment_number ||
    payload.track_number ||
    payload.cn_number ||
    "";

  if (!trackingNumber) {
    return res.status(400).json({ success: false, message: "Missing tracking number in webhook payload" });
  }

  const cleanTracking = String(trackingNumber).trim();
  const order = await Order.findOne({
    $or: [
      { "shipment.trackingNumber": cleanTracking },
      { courierTrackingCode: cleanTracking },
    ],
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: `No order found matching tracking number "${cleanTracking}"`,
    });
  }

  const rawStatus =
    payload.status ||
    payload.current_status ||
    payload.status_description ||
    payload.event ||
    "";

  const targetStatus = normalizeCourierStatus(rawStatus);
  const location = payload.location || payload.city || "Hub";
  const note = payload.note || payload.remarks || `Courier update: ${rawStatus || targetStatus} at ${location}`;

  // Idempotency: Prevent processing duplicate event if already recorded in statusHistory
  const isDuplicateEvent = order.statusHistory.some(
    (h) => h.orderStatus === targetStatus && h.note === note
  );

  if (isDuplicateEvent) {
    return res.json({
      success: true,
      message: "Duplicate webhook event ignored (already recorded)",
      orderReference: order.orderReference,
    });
  }

  // Monotonic Progression check
  const currentLevel = STAGE_HIERARCHY[order.orderStatus] || 0;
  const targetLevel = STAGE_HIERARCHY[targetStatus] || 0;

  let statusChanged = false;

  if (targetStatus === "returned") {
    order.orderStatus = "returned";
    order.trackingStage = 0;
    if (order.shipment) order.shipment.status = "returned";
    statusChanged = true;
  } else if (targetLevel > currentLevel) {
    order.orderStatus = targetStatus;
    order.trackingStage = Math.min(4, targetLevel);
    if (order.shipment) {
      order.shipment.status = targetStatus;
      if (targetStatus === "delivered") {
        order.shipment.deliveredAt = new Date();
        if (order.paymentMethod === "Cash on Delivery") {
          order.paymentStatus = "paid";
        }
      }
    }
    statusChanged = true;
  }

  order.statusHistory.push({
    stage: order.trackingStage,
    orderStatus: order.orderStatus,
    note: `${provider.toUpperCase()} Webhook: ${note}`,
    updatedBy: `${provider.toUpperCase()} Webhook`,
    timestamp: new Date(),
  });

  await order.save();

  res.json({
    success: true,
    message: statusChanged
      ? `Order status advanced to "${order.orderStatus}"`
      : "Tracking event recorded (status maintained)",
    orderReference: order.orderReference,
    currentStatus: order.orderStatus,
  });
});
