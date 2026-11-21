import * as payfastService from "../services/payfastService.js";
import Order from "../models/Order.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const initPayfast = asyncHandler(async (req, res) => {
  const orderRef = (req.body.orderReference || req.query.orderReference || "").trim().toUpperCase();
  if (orderRef) {
    const order = await Order.findOne({ orderReference: orderRef });
    if (!order) throw ApiError.notFound(`Order ${orderRef} not found`);
    const payload = payfastService.buildPayfastPayloadForOrder(order);
    return res.json(payload);
  }

  throw ApiError.badRequest("orderReference is required to initialize PayFast");
});

/**
 * PayFast IPN/notify endpoint — must always return a plain text response ("OK").
 */
export const payfastNotify = asyncHandler(async (req, res) => {
  try {
    const meta = { host: req.hostname, ip: req.ip };
    const message = await payfastService.handlePayfastNotify(req.body, meta);
    res.type("text").send(message);
  } catch (err) {
    const status = err?.statusCode || 500;
    res.status(status).type("text").send(err?.message || "ERROR");
  }
});

/**
 * Sandbox Simulator: Immediately marks PayFast order as paid in sandbox mode
 */
export const simulateSandboxPayment = asyncHandler(async (req, res) => {
  const orderRef = req.params.orderReference || req.body.orderReference;
  const result = await payfastService.simulatePayfastSandboxPayment(orderRef);
  res.json(result);
});
