import nodemailer from "nodemailer";
import EmailOutbox from "../models/EmailOutbox.js";
import { env } from "../config/env.js";

let transporter = null;

/**
 * Initialize Nodemailer transporter lazily based on environment configuration.
 */
function getTransporter() {
  if (transporter) return transporter;

  const isConfigured = Boolean(env.SMTP.HOST && env.SMTP.USER && env.SMTP.PASS);

  if (isConfigured) {
    transporter = nodemailer.createTransport({
      host: env.SMTP.HOST,
      port: env.SMTP.PORT,
      secure: env.SMTP.SECURE,
      auth: {
        user: env.SMTP.USER,
        pass: env.SMTP.PASS,
      },
    });
  } else {
    // Simulated transporter in development when SMTP is not configured
    transporter = {
      sendMail: async (mailOptions) => {
        console.log(
          `[EmailService:Simulated] To: ${mailOptions.to} | Subject: "${mailOptions.subject}"`
        );
        return { messageId: `simulated-${Date.now()}` };
      },
    };
  }

  return transporter;
}

/**
 * Responsive HTML Template: Order Confirmation
 */
export function generateOrderConfirmationHTML(data) {
  const {
    orderReference,
    customer,
    shippingAddress,
    items,
    subtotal,
    discountAmount,
    shippingFee,
    total,
    paymentMethod,
    estimatedDelivery,
  } = data;

  const itemsHtml = items
    .map(
      (it) => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #1E293B;">
        <strong>${it.name}</strong>${it.size ? ` (${it.size})` : ""}${
        it.isDeal ? ' <span style="color:#C2410C; font-size:11px; font-weight:bold;">[FLASH DEAL]</span>' : ""
      }
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #E2E8F0; font-size: 13px; text-align: center; color: #475569;">
        ${it.quantity}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #E2E8F0; font-size: 13px; text-align: right; color: #1E293B; font-family: monospace;">
        Rs. ${Number(it.price).toLocaleString("en-PK")}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #E2E8F0; font-size: 13px; text-align: right; font-weight: 600; color: #15472B; font-family: monospace;">
        Rs. ${Number(it.lineTotal || it.price * it.quantity).toLocaleString("en-PK")}
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation - ${orderReference}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden;">
    <!-- Header -->
    <div style="background-color: #15472B; padding: 28px 24px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 22px; letter-spacing: 0.05em; font-weight: 700;">PAK VEDA</h1>
      <p style="margin: 6px 0 0; color: #D1E7DD; font-size: 13px; letter-spacing: 0.02em;">Artisanal Cold-Pressed Harvest &amp; Wellness</p>
    </div>

    <!-- Body -->
    <div style="padding: 24px;">
      <div style="border-bottom: 2px solid #F1F5F9; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="display: inline-block; background-color: #ECFDF5; color: #047857; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;">Order Confirmed</span>
        <h2 style="margin: 12px 0 4px; color: #0F172A; font-size: 18px;">Thank You for Your Order, ${customer.name}!</h2>
        <p style="margin: 0; color: #64748B; font-size: 13px;">Order Reference: <strong style="color: #15472B; font-family: monospace;">${orderReference}</strong></p>
      </div>

      <!-- Shipping & Payment Details -->
      <table style="width: 100%; margin-bottom: 24px; font-size: 13px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width: 50%; vertical-align: top; padding-right: 12px;">
            <p style="margin: 0 0 4px; color: #64748B; text-transform: uppercase; font-size: 11px; font-weight: 600;">Delivery Address</p>
            <p style="margin: 0; color: #0F172A; font-weight: 500;">${customer.name}</p>
            <p style="margin: 2px 0; color: #475569;">${shippingAddress.address}</p>
            <p style="margin: 0; color: #475569;">${shippingAddress.city}${shippingAddress.area ? `, ${shippingAddress.area}` : ""}</p>
            <p style="margin: 2px 0; color: #475569;">Phone: ${customer.phone}</p>
          </td>
          <td style="width: 50%; vertical-align: top; padding-left: 12px;">
            <p style="margin: 0 0 4px; color: #64748B; text-transform: uppercase; font-size: 11px; font-weight: 600;">Payment &amp; Delivery</p>
            <p style="margin: 0; color: #0F172A; font-weight: 500;">${paymentMethod}</p>
            <p style="margin: 4px 0 0; color: #64748B; font-size: 12px;">Estimated Dispatch:</p>
            <p style="margin: 0; color: #15472B; font-weight: 500; font-size: 12px;">${estimatedDelivery || "2–3 working days via TCS Express"}</p>
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;" cellpadding="0" cellspacing="0">
        <thead>
          <tr style="background-color: #F8FAFC; text-align: left;">
            <th style="padding: 10px 8px; border-bottom: 2px solid #E2E8F0; font-size: 11px; text-transform: uppercase; color: #64748B;">Item</th>
            <th style="padding: 10px 8px; border-bottom: 2px solid #E2E8F0; font-size: 11px; text-transform: uppercase; color: #64748B; text-align: center;">Qty</th>
            <th style="padding: 10px 8px; border-bottom: 2px solid #E2E8F0; font-size: 11px; text-transform: uppercase; color: #64748B; text-align: right;">Price</th>
            <th style="padding: 10px 8px; border-bottom: 2px solid #E2E8F0; font-size: 11px; text-transform: uppercase; color: #64748B; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Price Breakdown -->
      <table style="width: 100%; font-size: 13px; font-family: monospace;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 4px 8px; color: #64748B;">Subtotal:</td>
          <td style="padding: 4px 8px; text-align: right; color: #0F172A;">Rs. ${Number(subtotal).toLocaleString("en-PK")}</td>
        </tr>
        ${
          discountAmount > 0
            ? `<tr>
                <td style="padding: 4px 8px; color: #C2410C;">Discount:</td>
                <td style="padding: 4px 8px; text-align: right; color: #C2410C;">-Rs. ${Number(discountAmount).toLocaleString("en-PK")}</td>
              </tr>`
            : ""
        }
        <tr>
          <td style="padding: 4px 8px; color: #64748B;">Delivery Fee:</td>
          <td style="padding: 4px 8px; text-align: right; color: #0F172A;">${shippingFee === 0 ? "FREE" : `Rs. ${Number(shippingFee).toLocaleString("en-PK")}`}</td>
        </tr>
        <tr style="font-weight: 700; font-size: 15px; border-top: 1px solid #E2E8F0;">
          <td style="padding: 10px 8px; color: #0F172A;">Final Total:</td>
          <td style="padding: 10px 8px; text-align: right; color: #15472B;">Rs. ${Number(total).toLocaleString("en-PK")}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="background-color: #F8FAFC; padding: 18px 24px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">
      <p style="margin: 0 0 6px;">Need assistance? Contact us at support@zaitoonpakistan.pk or WhatsApp at 0300-9248666.</p>
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} Pak Veda / Zaitoon Pakistan. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Responsive HTML Template: Shipment Confirmation
 */
export function generateShipmentConfirmationHTML(data) {
  const {
    orderReference,
    customer,
    shippingAddress,
    courierName,
    trackingNumber,
    trackingUrl,
    estimatedDelivery,
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Order Has Been Dispatched - ${orderReference}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden;">
    <!-- Header -->
    <div style="background-color: #15472B; padding: 28px 24px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 22px; letter-spacing: 0.05em; font-weight: 700;">PAK VEDA</h1>
      <p style="margin: 6px 0 0; color: #D1E7DD; font-size: 13px; letter-spacing: 0.02em;">Artisanal Cold-Pressed Harvest &amp; Wellness</p>
    </div>

    <!-- Body -->
    <div style="padding: 24px;">
      <div style="border-bottom: 2px solid #F1F5F9; padding-bottom: 16px; margin-bottom: 20px; text-align: center;">
        <span style="display: inline-block; background-color: #EFF6FF; color: #1D4ED8; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;">Shipment Dispatched</span>
        <h2 style="margin: 14px 0 6px; color: #0F172A; font-size: 20px;">Your Parcel is on the Way!</h2>
        <p style="margin: 0; color: #64748B; font-size: 13px;">Order <strong style="color: #15472B; font-family: monospace;">${orderReference}</strong> has been handed over to <strong>${courierName}</strong>.</p>
      </div>

      <!-- Tracking Box -->
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; color: #64748B; font-weight: 600;">Courier Tracking Number</p>
        <p style="margin: 0 0 16px; font-size: 20px; font-family: monospace; font-weight: 700; color: #0F172A; letter-spacing: 0.05em;">${trackingNumber}</p>
        ${
          trackingUrl
            ? `<a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #15472B; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 13px; font-weight: 600; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.04em;">Track Your Parcel &rarr;</a>`
            : ""
        }
      </div>

      <!-- Delivery Info -->
      <table style="width: 100%; margin-bottom: 20px; font-size: 13px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width: 50%; vertical-align: top; padding-right: 12px;">
            <p style="margin: 0 0 4px; color: #64748B; text-transform: uppercase; font-size: 11px; font-weight: 600;">Destination</p>
            <p style="margin: 0; color: #0F172A; font-weight: 500;">${customer.name}</p>
            <p style="margin: 2px 0; color: #475569;">${shippingAddress.address}</p>
            <p style="margin: 0; color: #475569;">${shippingAddress.city}</p>
          </td>
          <td style="width: 50%; vertical-align: top; padding-left: 12px;">
            <p style="margin: 0 0 4px; color: #64748B; text-transform: uppercase; font-size: 11px; font-weight: 600;">Courier Service</p>
            <p style="margin: 0; color: #0F172A; font-weight: 500;">${courierName}</p>
            <p style="margin: 4px 0 0; color: #64748B; font-size: 12px;">Expected Delivery:</p>
            <p style="margin: 0; color: #15472B; font-weight: 500; font-size: 12px;">${estimatedDelivery || "2–3 working days"}</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="background-color: #F8FAFC; padding: 18px 24px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">
      <p style="margin: 0 0 6px;">Questions? Reach out to support@zaitoonpakistan.pk or WhatsApp at 0300-9248666.</p>
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} Pak Veda / Zaitoon Pakistan. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Queue order confirmation email into the transactional outbox.
 * Non-blocking: returns immediately after inserting outbox record.
 */
export async function queueOrderConfirmationEmail(order) {
  if (!order?.customer?.email) {
    return null;
  }

  try {
    const outboxEntry = await EmailOutbox.create({
      orderReference: order.orderReference,
      recipient: order.customer.email,
      subject: `Order Confirmation: ${order.orderReference} - Pak Veda`,
      template: "order_confirmation",
      payload: {
        orderReference: order.orderReference,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        items: order.items,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        shippingFee: order.shippingFee,
        total: order.total,
        paymentMethod: order.paymentMethod,
        estimatedDelivery: order.estimatedDelivery,
      },
      status: "pending",
    });

    // Trigger dispatcher asynchronously
    setImmediate(() => {
      processEmailOutbox().catch((e) =>
        console.error("[EmailService] Background dispatch error:", e.message)
      );
    });

    return outboxEntry;
  } catch (err) {
    console.error(
      `[EmailService] Failed to queue confirmation email for ${order.orderReference}:`,
      err.message
    );
    return null;
  }
}

/**
 * Queue shipment dispatched email into the transactional outbox.
 */
export async function queueShipmentDispatchedEmail(order) {
  if (!order?.customer?.email) {
    return null;
  }

  try {
    const courierName = order.shipment?.provider
      ? order.shipment.provider.toUpperCase() + " Express"
      : order.courierName || "Courier Express";

    const trackingNumber =
      order.shipment?.trackingNumber || order.courierTrackingCode;
    const trackingUrl = order.shipment?.trackingUrl || "";

    const outboxEntry = await EmailOutbox.create({
      orderReference: order.orderReference,
      recipient: order.customer.email,
      subject: `Dispatched: Your Order ${order.orderReference} is on its way via ${courierName}`,
      template: "shipment_dispatched",
      payload: {
        orderReference: order.orderReference,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        courierName,
        trackingNumber,
        trackingUrl,
        estimatedDelivery: order.estimatedDelivery,
      },
      status: "pending",
    });

    setImmediate(() => {
      processEmailOutbox().catch((e) =>
        console.error("[EmailService] Background dispatch error:", e.message)
      );
    });

    return outboxEntry;
  } catch (err) {
    console.error(
      `[EmailService] Failed to queue shipment email for ${order.orderReference}:`,
      err.message
    );
    return null;
  }
}

/**
 * Processes pending items in EmailOutbox.
 * Can be called immediately or via cron/timer.
 */
export async function processEmailOutbox(limit = 10) {
  const pending = await EmailOutbox.find({
    status: { $in: ["pending", "failed"] },
    attempts: { $lt: 3 },
  })
    .sort({ createdAt: 1 })
    .limit(limit);

  if (pending.length === 0) return { processed: 0 };

  const client = getTransporter();
  let processed = 0;

  for (const entry of pending) {
    try {
      let html = "";
      if (entry.template === "order_confirmation") {
        html = generateOrderConfirmationHTML(entry.payload);
      } else if (entry.template === "shipment_dispatched") {
        html = generateShipmentConfirmationHTML(entry.payload);
      } else {
        throw new Error(`Unknown email template: ${entry.template}`);
      }

      await client.sendMail({
        from: env.SMTP.FROM,
        to: entry.recipient,
        subject: entry.subject,
        html,
      });

      entry.status = "sent";
      entry.sentAt = new Date();
      entry.lastError = null;
      await entry.save();
      processed++;
    } catch (err) {
      entry.attempts += 1;
      entry.lastError = err.message || "Failed to send email";
      if (entry.attempts >= 3) {
        entry.status = "failed";
      }
      await entry.save();
      console.warn(
        `[EmailService] Attempt ${entry.attempts} failed for ${entry.orderReference}:`,
        err.message
      );
    }
  }

  return { processed };
}
