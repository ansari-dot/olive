import crypto from "crypto";
import Order from "../models/Order.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

const SIGNATURE_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "payment_method",
];

function pfEncode(value) {
  return encodeURIComponent(String(value))
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function buildSignatureString(data, passphrase = "", orderedKeys = null) {
  const keys =
    Array.isArray(orderedKeys) && orderedKeys.length
      ? orderedKeys
      : Object.keys(data);
  const query = keys
    .filter((k) => data[k] !== undefined && data[k] !== null && data[k] !== "")
    .map((key) => `${key}=${pfEncode(data[key])}`)
    .join("&");
  const trimmedPass = String(passphrase || "").trim();
  return trimmedPass ? `${query}&passphrase=${pfEncode(trimmedPass)}` : query;
}

export function generateSignature(data, passphrase = "", orderedKeys = null) {
  const str = buildSignatureString(data, passphrase, orderedKeys);
  return crypto.createHash("md5").update(str).digest("hex");
}

/**
 * Builds the signed PayFast payload for an existing Order.
 * In Sandbox mode, uses default test merchant ID & key.
 * Later, live credentials in .env will seamlessly replace them.
 */
export function buildPayfastPayloadForOrder(order, options = {}) {
  const merchant_id = env.PAYFAST.MERCHANT_ID || "10058885";
  const merchant_key = env.PAYFAST.MERCHANT_KEY || "e43ad0kpt2n2t";
  const passphrase = env.PAYFAST.PASSPHRASE || "";

  const clientUrl = (options.clientUrl || env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
  const serverUrl = (options.serverUrl || env.SERVER_URL || "http://localhost:5000").replace(/\/$/, "");

  const customerName = (order.customer?.name || "Customer").trim();
  const nameParts = customerName.split(" ");
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || "Valued";

  const payload = {
    merchant_id,
    merchant_key,
    return_url: `${clientUrl}/order-tracking?orderId=${order.orderReference}&payfast=success`,
    cancel_url: `${clientUrl}/checkout?cancel=1&orderId=${order.orderReference}`,
    notify_url: `${serverUrl}/api/payments/payfast/notify`,
    name_first: firstName,
    name_last: lastName,
    email_address: (order.customer?.email || "").trim() || "orders@pakveda.com",
    m_payment_id: order.orderReference,
    amount: Number(order.total).toFixed(2),
    item_name: `Pak Veda Order ${order.orderReference}`,
    custom_str1: (order.customer?.phone || "").trim(),
  };

  const signature = generateSignature(payload, passphrase, SIGNATURE_FIELD_ORDER);

  return {
    payment_url: env.PAYFAST.URL || "https://sandbox.payfast.co.za/eng/process",
    fields: { ...payload, signature },
    orderReference: order.orderReference,
    isSandbox: (env.PAYFAST.URL || "").includes("sandbox") || !env.IS_PROD,
  };
}

/**
 * Verifies PayFast IPN Signature
 */
function verifyIpnSignature(body) {
  const provided = String(body.signature || "");
  if (!provided) return false;

  const keys = Object.keys(body).filter((k) => k !== "signature");
  const data = keys.reduce((acc, k) => {
    acc[k] = body[k];
    return acc;
  }, {});
  const expected = generateSignature(data, env.PAYFAST.PASSPHRASE || "", keys);

  const a = Buffer.from(provided.toLowerCase());
  const b = Buffer.from(expected.toLowerCase());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Handle PayFast ITN / notify webhook callback
 */
export async function handlePayfastNotify(rawBody, meta = {}) {
  let body = rawBody || {};
  if (typeof body === "string") {
    body = Object.fromEntries(new URLSearchParams(body).entries());
  }
  if (!body || Object.keys(body).length === 0) {
    throw ApiError.badRequest("Empty body");
  }

  const orderReference = (body.m_payment_id || body.custom_str1 || "").trim().toUpperCase();
  if (!orderReference) throw ApiError.badRequest("Missing order reference in IPN");

  console.log(`[PayFast ITN Webhook] Received notification for ${orderReference}. Status: ${body.payment_status}`);

  // In production or when passphrase is set, verify signature
  if (body.signature) {
    const isValid = verifyIpnSignature(body);
    if (!isValid) {
      if (env.IS_PROD) {
        console.warn(`[PayFast ITN] Signature verification failed for order ${orderReference}`);
        throw ApiError.unauthorized("Invalid PayFast IPN signature");
      } else {
        console.warn(`[PayFast ITN] Non-blocking signature warning in sandbox/dev mode for order ${orderReference}`);
      }
    }
  }

  const order = await Order.findOne({
    $or: [{ orderReference }, { orderCode: orderReference }],
  });

  if (!order) {
    throw ApiError.notFound(`Order ${orderReference} not found`);
  }

  const status = String(body.payment_status || "").toUpperCase();

  if (status === "COMPLETE") {
    if (order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.statusHistory.push({
        stage: order.trackingStage,
        orderStatus: order.orderStatus,
        note: `Payment settled via PayFast Sandbox/IPN (Ref: ${body.pf_payment_id || "PF-OK"})`,
        updatedBy: "PayFast IPN",
        timestamp: new Date(),
      });
      await order.save();
    }
    return "OK";
  }

  if (status === "CANCELLED" || status === "FAILED") {
    order.paymentStatus = "failed";
    order.statusHistory.push({
      stage: order.trackingStage,
      orderStatus: order.orderStatus,
      note: `PayFast transaction status: ${status}`,
      updatedBy: "PayFast IPN",
      timestamp: new Date(),
    });
    await order.save();
    return "OK";
  }

  return "OK";
}

/**
 * Sandbox helper: Immediately mark an order as paid in sandbox mode
 */
export async function simulatePayfastSandboxPayment(orderReference) {
  const cleanRef = String(orderReference).trim().toUpperCase();
  const order = await Order.findOne({ orderReference: cleanRef });
  if (!order) throw ApiError.notFound(`Order ${cleanRef} not found`);

  order.paymentStatus = "paid";
  order.statusHistory.push({
    stage: order.trackingStage,
    orderStatus: order.orderStatus,
    note: "Payment settled via PayFast Sandbox Simulator",
    updatedBy: "PayFast Sandbox",
    timestamp: new Date(),
  });

  await order.save();

  return {
    success: true,
    message: "PayFast Sandbox payment captured successfully",
    order,
  };
}
