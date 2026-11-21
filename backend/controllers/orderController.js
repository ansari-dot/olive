import * as orderService from "../services/orderService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Public: POST /api/orders (Guest checkout)
export const createOrder = asyncHandler(async (req, res) => {
  const idempotencyKey =
    req.headers["x-idempotency-key"] ||
    req.body.idempotencyKey ||
    req.body.idempotency_key ||
    null;

  const result = await orderService.createOrder(req.body, idempotencyKey);
  res.status(201).json({
    success: true,
    message: result.isDuplicate
      ? "Existing order retrieved"
      : "Harvest order placed successfully",
    ...result,
  });
});

// Public: GET /api/orders/track/:orderReference
export const trackOrder = asyncHandler(async (req, res) => {
  const result = await orderService.trackOrder(req.params.orderReference);
  res.json(result);
});

// Public: PATCH /api/orders/:orderReference/payment-method
export const updatePaymentMethod = asyncHandler(async (req, res) => {
  const result = await orderService.updateOrderPaymentMethod(
    req.params.orderReference,
    req.body.paymentMethod
  );
  res.json(result);
});

// Admin: GET /api/admin/orders
export const getAdminOrders = asyncHandler(async (req, res) => {
  const result = await orderService.listAdminOrders(req.query);
  res.json({
    success: true,
    ...result,
    data: result.orders,
  });
});

// Admin: GET /api/admin/orders/:orderReference
export const getAdminOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getAdminOrderByRef(req.params.orderReference);
  res.json({
    success: true,
    order,
    data: order,
  });
});

// Admin: POST /api/admin/orders/:orderReference/shipment (Generate Courier Shipment)
export const initiateShipment = asyncHandler(async (req, res) => {
  const order = await orderService.initiateShipment(
    req.params.orderReference,
    req.body,
    req.admin
  );
  res.json({
    success: true,
    message: `Shipment successfully booked with ${order.courierName}`,
    order,
    data: order,
  });
});

// Admin: POST /api/admin/orders/:orderReference/sync-tracking
export const syncCourierStatus = asyncHandler(async (req, res) => {
  const result = await orderService.syncCourierStatus(
    req.params.orderReference,
    req.admin
  );
  res.json({
    success: true,
    message: "Courier tracking synchronized",
    ...result,
  });
});

// Admin: POST /api/admin/orders/:orderReference/return
export const processReturn = asyncHandler(async (req, res) => {
  const order = await orderService.processReturn(
    req.params.orderReference,
    req.body,
    req.admin
  );
  res.json({
    success: true,
    message: `Return action "${req.body.action}" completed`,
    order,
    data: order,
  });
});

// Admin: PATCH /api/admin/orders/:orderReference/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.orderReference,
    req.body,
    req.admin
  );
  res.json({
    success: true,
    message: "Order status updated",
    order,
    data: order,
  });
});

// Admin: PATCH /api/admin/orders/:orderReference/tracking
export const updateOrderTracking = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderTracking(
    req.params.orderReference,
    req.body,
    req.admin
  );
  res.json({
    success: true,
    message: "Courier tracking updated",
    order,
    data: order,
  });
});

// Admin: PATCH /api/admin/orders/:orderReference/payment
export const updateOrderPayment = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderPayment(
    req.params.orderReference,
    req.body,
    req.admin
  );
  res.json({
    success: true,
    message: "Payment status updated",
    order,
    data: order,
  });
});

// Admin: PATCH /api/admin/orders/:orderReference/cancel
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(
    req.params.orderReference,
    req.body,
    req.admin
  );
  res.json({
    success: true,
    message: "Order cancelled and inventory restored",
    order,
    data: order,
  });
});
