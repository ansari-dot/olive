import * as orderService from "../services/orderService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAdminAction } from "../services/auditService.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  logAdminAction({
    req,
    action: "order:shipment_created",
    targetResource: "Order",
    targetId: order.orderReference,
    details: { courierName: order.courierName, trackingCode: order.courierTrackingCode },
  });

  return ApiResponse.success(
    res,
    { order, data: order },
    `Shipment successfully booked with ${order.courierName}`
  );
});

// Admin: POST /api/admin/orders/:orderReference/sync-tracking
export const syncCourierStatus = asyncHandler(async (req, res) => {
  const result = await orderService.syncCourierStatus(
    req.params.orderReference,
    req.admin
  );
  return ApiResponse.success(res, result, "Courier tracking synchronized");
});

// Admin: POST /api/admin/orders/:orderReference/return
export const processReturn = asyncHandler(async (req, res) => {
  const order = await orderService.processReturn(
    req.params.orderReference,
    req.body,
    req.admin
  );

  logAdminAction({
    req,
    action: `order:return_${req.body?.action || "action"}`,
    targetResource: "Order",
    targetId: order.orderReference,
    details: { returnDetails: order.returnDetails },
  });

  return ApiResponse.success(
    res,
    { order, data: order },
    `Return action "${req.body.action}" completed`
  );
});

// Admin: PATCH /api/admin/orders/:orderReference/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.orderReference,
    req.body,
    req.admin
  );

  logAdminAction({
    req,
    action: "order:update_status",
    targetResource: "Order",
    targetId: order.orderReference,
    details: { newStatus: order.orderStatus, note: req.body?.note },
  });

  return ApiResponse.success(res, { order, data: order }, "Order status updated");
});

// Admin: PATCH /api/admin/orders/:orderReference/tracking
export const updateOrderTracking = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderTracking(
    req.params.orderReference,
    req.body,
    req.admin
  );
  return ApiResponse.success(res, { order, data: order }, "Courier tracking updated");
});

// Admin: PATCH /api/admin/orders/:orderReference/payment
export const updateOrderPayment = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderPayment(
    req.params.orderReference,
    req.body,
    req.admin
  );

  logAdminAction({
    req,
    action: "order:update_payment",
    targetResource: "Order",
    targetId: order.orderReference,
    details: { paymentStatus: order.paymentStatus, ibftReference: req.body?.ibftReference },
  });

  return ApiResponse.success(res, { order, data: order }, "Payment status updated");
});

// Admin: PATCH /api/admin/orders/:orderReference/cancel
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(
    req.params.orderReference,
    req.body,
    req.admin
  );

  logAdminAction({
    req,
    action: "order:cancel",
    targetResource: "Order",
    targetId: order.orderReference,
    details: { cancelReason: req.body?.cancelReason },
  });

  return ApiResponse.success(
    res,
    { order, data: order },
    "Order cancelled and inventory restored"
  );
});

// Admin: DELETE /api/admin/orders/all
export const deleteAllOrders = asyncHandler(async (req, res) => {
  const result = await orderService.deleteAllOrders();

  logAdminAction({
    req,
    action: "order:delete_all",
    targetResource: "Order",
    targetId: "ALL",
    details: { deletedCount: result.deletedCount },
  });

  return ApiResponse.success(res, result);
});

// Admin: DELETE /api/admin/orders/:orderReference
export const deleteOrder = asyncHandler(async (req, res) => {
  const result = await orderService.deleteOrder(req.params.orderReference);

  logAdminAction({
    req,
    action: "order:delete_single",
    targetResource: "Order",
    targetId: req.params.orderReference,
  });

  return ApiResponse.success(res, result);
});
