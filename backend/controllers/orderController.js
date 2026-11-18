import * as orderService from "../services/orderService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Public: POST /api/orders (Guest checkout)
export const createOrder = asyncHandler(async (req, res) => {
  const result = await orderService.createOrder(req.body);
  res.status(201).json({
    success: true,
    message: "Harvest order placed successfully",
    ...result,
  });
});

// Public: GET /api/orders/track/:orderReference
export const trackOrder = asyncHandler(async (req, res) => {
  const result = await orderService.trackOrder(req.params.orderReference);
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
