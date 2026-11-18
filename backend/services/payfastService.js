import crypto from "crypto";
import DealSection from "../models/DealSection.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { applyCouponToItems, redeemCouponByCode } from "./couponService.js";
import { makeOrderCode } from "./orderService.js";
import {
  decrementStockAtomic,
  findOutOfStockItems,
} from "./productService.js";

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

function isDealActive(deal) {
  if (!deal) return false;
  if (deal.discountType === "none") return false;
  if (typeof deal.discountValue !== "number" || deal.discountValue <= 0) return false;
  if (!deal.endsAt) return false;
  const end = new Date(deal.endsAt).getTime();
  if (Number.isNaN(end) || end <= Date.now()) return false;
  return true;
}

function getDealPrice(price, deal) {
  const base = Number(price || 0);
  if (!isDealActive(deal)) return base;
  if (deal.discountType === "amount") return Math.max(0, base - deal.discountValue);
  return Math.max(0, Math.round(base * (1 - deal.discountValue / 100)));
}

async function buildOrderItems(cartItems) {
  const productIds = cartItems.map((c) => c.productId).filter(Boolean);
  const [products, deal] = await Promise.all([
    Product.find({ _id: { $in: productIds } }).lean(),
    DealSection.findOne().lean(),
  ]);
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  return cartItems.map((c) => {
    const prod = productMap.get(String(c.productId));
    const basePrice = prod?.price || c.unitPrice || 0;
    const isDeal = !!prod?.isDeal && isDealActive(deal);
    const unitPrice = isDeal ? getDealPrice(basePrice, deal) : Number(basePrice || 0);
    return {
      productId: prod?._id || c.productId,
      title: prod?.title || c.title || "Item",
      img: c.img || "",
      qty: Number(c.qty || 1),
      unitPrice,
      originalPrice: Number(basePrice || 0),
      priceUnit: prod?.priceUnit || c.priceUnit || "per yard",
      isDeal,
      size: c.size || "",
      color: c.color || "",
      colorHex: c.colorHex || "",
      sku: prod?.sku || c.sku || "",
      subcategorySerial: c.subcategorySerial || "",
    };
  });
}

/**
 * Build a PayFast checkout payload and persist a Pending order. Returns the
 * fields the client should POST to PayFast (plus the order code).
 */
export async function initPayfastCheckout({ cartItems, customer = {}, couponCode = "" }, { debug = false } = {}) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw ApiError.badRequest("Cart is empty");
  }

  // Pre-flight stock check — surface "out of stock" *before* the user is
  // bounced over to PayFast. Atomic decrement still happens in the IPN
  // handler (the real source of truth) — this is purely UX so customers
  // don't pay for items we can't fulfil.
  const stockIssues = await findOutOfStockItems(cartItems);
  if (stockIssues.length > 0) {
    throw ApiError.badRequest("Some items are out of stock", { items: stockIssues });
  }

  const items = await buildOrderItems(cartItems);
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);

  const { discount, code: appliedCode } = await applyCouponToItems(couponCode, items);
  const total = Math.max(0, subtotal - discount);

  const order = await Order.create({
    orderCode: makeOrderCode(),
    customer,
    items,
    subtotal,
    discount,
    total,
    couponCode: appliedCode,
    status: "Pending",
    paymentStatus: "Pending",
    paymentProvider: "payfast",
  });

  const merchant_id = env.PAYFAST.MERCHANT_ID;
  const merchant_key = env.PAYFAST.MERCHANT_KEY;
  const passphrase = env.PAYFAST.PASSPHRASE;

  if (!merchant_id || !merchant_key) {
    throw ApiError.internal("PayFast credentials are not configured");
  }

  const clientUrl = env.CLIENT_URL || "http://localhost:5173";
  const serverUrl = env.SERVER_URL || "http://localhost:5000";

  const payload = {
    merchant_id,
    merchant_key,
    return_url: `${clientUrl}/payment-confirmation?order=${order.orderCode}`,
    cancel_url: `${clientUrl}/checkout?cancel=1&order=${order.orderCode}`,
    notify_url: `${serverUrl}/api/payments/payfast/notify`,
    name_first: customer.firstName || "",
    name_last: customer.lastName || "",
    email_address: customer.email || "",
    m_payment_id: order.orderCode,
    amount: Number(total).toFixed(2),
    item_name: `Order ${order.orderCode}`,
  };

  const signatureString = buildSignatureString(payload, passphrase, SIGNATURE_FIELD_ORDER);
  const signature = generateSignature(payload, passphrase, SIGNATURE_FIELD_ORDER);

  return {
    payment_url: env.PAYFAST.URL,
    fields: { ...payload, signature },
    orderCode: order.orderCode,
    debug: debug || env.PAYFAST.DEBUG
      ? { signatureString, signature }
      : undefined,
  };
}

// IP ranges that PayFast publishes for live IPN callers. Sandbox uses
// `sandbox.payfast.co.za`. Resolving DNS at boot would also work; we keep a
// static allow-list for simplicity and supplement it with a config flag.
const PAYFAST_IPN_HOSTS = [
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
];

/**
 * Verify the IPN signature: PayFast posts every field plus a `signature`
 * that is the MD5 of the URL-encoded form data (in posted order), with the
 * passphrase appended if set. We reconstruct that hash on our side and
 * compare in constant time. This blocks the trivial "forge an IPN and mark
 * an order paid" attack.
 */
function verifyIpnSignature(body) {
  const provided = String(body.signature || "");
  if (!provided) return false;

  const keys = Object.keys(body).filter((k) => k !== "signature");
  const data = keys.reduce((acc, k) => {
    acc[k] = body[k];
    return acc;
  }, {});
  const expected = generateSignature(data, env.PAYFAST.PASSPHRASE, keys);

  const a = Buffer.from(provided.toLowerCase());
  const b = Buffer.from(expected.toLowerCase());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Optional second layer: ask PayFast to validate the payload back to us.
 * Disabled by default because it adds latency; enable in production with
 * `PAYFAST_VERIFY_POSTBACK=true` for paranoid mode.
 */
async function verifyIpnPostback(body) {
  const validateUrl = env.PAYFAST.URL.replace(
    "/eng/process",
    "/eng/query/validate"
  );
  const form = new URLSearchParams(body).toString();
  const r = await fetch(validateUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const text = (await r.text()).trim();
  return text === "VALID";
}

/**
 * Handle PayFast ITN (notify) callback. Returns `'OK'` (PayFast convention)
 * when the order is updated, otherwise throws an ApiError with the right code.
 *
 * Security: we verify (1) the signature against our passphrase, optionally
 * (2) the source host/IP, and optionally (3) a postback validation call to
 * PayFast itself. Only then do we mutate the order.
 */
export async function handlePayfastNotify(rawBody, meta = {}) {
  let body = rawBody || {};
  if (typeof body === "string") {
    body = Object.fromEntries(new URLSearchParams(body).entries());
  }
  if (!body || Object.keys(body).length === 0) {
    throw ApiError.badRequest("empty body");
  }
  const orderCode = body.m_payment_id;
  if (!orderCode) throw ApiError.badRequest("missing order");

  // (1) Signature check — blocks forged IPNs from anonymous clients.
  if (!verifyIpnSignature(body)) {
    throw ApiError.unauthorized("invalid signature");
  }

  // (2) Source host check (opt-in via PAYFAST_VERIFY_IP=true).
  if (env.PAYFAST.VERIFY_IP) {
    const host = String(meta.host || "").toLowerCase();
    if (!PAYFAST_IPN_HOSTS.some((h) => host.endsWith(h))) {
      throw ApiError.forbidden("unauthorized source host");
    }
  }

  // (3) Postback validation (opt-in via PAYFAST_VERIFY_POSTBACK=true).
  if (env.PAYFAST.VERIFY_POSTBACK) {
    const ok = await verifyIpnPostback(body);
    if (!ok) throw ApiError.unauthorized("postback validation failed");
  }

  const order = await Order.findOne({ orderCode });
  if (!order) throw ApiError.notFound("not found");

  // Optional amount sanity check — protects against IPNs that report a
  // different amount than what we recorded.
  const reportedGross = Number(body.amount_gross || body.amount || 0);
  if (
    reportedGross > 0 &&
    Math.abs(reportedGross - Number(order.total || 0)) > 0.01
  ) {
    throw ApiError.badRequest("amount mismatch");
  }

  const status = String(body.payment_status || "").toUpperCase();
  const payfastMeta = {
    pf_payment_id: body.pf_payment_id,
    payment_status: body.payment_status,
    signature: body.signature,
  };

  if (status === "COMPLETE") {
    // Atomic state transition: only one IPN delivery (the first) can flip
    // Pending -> Paid. PayFast retries on any non-200, so without this guard
    // a flaky network would credit the same payment multiple times — which
    // here would mean double-decrementing stock and double-redeeming coupons.
    const transitioned = await Order.findOneAndUpdate(
      { orderCode, paymentStatus: { $ne: "Paid" } },
      {
        $set: {
          paymentStatus: "Paid",
          status: "Confirmed",
          paidAt: new Date(),
          payfast: payfastMeta,
        },
      },
      { new: true }
    );

    if (!transitioned) {
      // Already paid in a previous delivery — acknowledge so PayFast stops
      // retrying, but skip every side-effect.
      return "OK";
    }

    // Side effects, gated by `stockReservedAt` so even a second IPN that
    // somehow slipped past the transition check above can't double-decrement.
    const reserve = await Order.findOneAndUpdate(
      { _id: transitioned._id, stockReservedAt: null },
      { $set: { stockReservedAt: new Date() } },
      { new: true }
    );
    if (reserve) {
      for (const item of transitioned.items) {
        if (!item.productId) continue;
        const ok = await decrementStockAtomic(item.productId, item.qty);
        if (!ok) {
          // Stock went to zero between checkout init and IPN delivery.
          // Log it loudly — the payment is already captured, so this needs
          // human intervention (refund or restock).
          console.warn(
            `[payfast] oversold product ${item.productId} on order ${orderCode}`
          );
        }
      }
      if (transitioned.couponCode) {
        await redeemCouponByCode(transitioned.couponCode);
      }
    }
    return "OK";
  }

  // Non-success terminal states — write straight through; idempotent because
  // we never run side-effects here, only mark the order.
  if (status === "FAILED" || status === "CANCELLED") {
    await Order.updateOne(
      { _id: order._id, paymentStatus: { $nin: ["Paid"] } },
      {
        $set: {
          paymentStatus: status === "FAILED" ? "Failed" : "Cancelled",
          status: "Cancelled",
          payfast: payfastMeta,
        },
      }
    );
    return "OK";
  }

  // Intermediate states (e.g. PENDING) — record the payfast metadata for
  // debugging but don't move the order.
  order.payfast = payfastMeta;
  await order.save();
  return "OK";
}
