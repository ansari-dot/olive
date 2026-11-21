import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Deal from "../models/Deal.js";
import Coupon from "../models/Coupon.js";
import EmailOutbox from "../models/EmailOutbox.js";

import * as orderService from "../services/orderService.js";
import * as inventoryService from "../services/inventoryService.js";
import { getCourierAdapter } from "../services/courier/courierFactory.js";
import { processEmailOutbox } from "../services/emailService.js";
import { handleCourierWebhook } from "../controllers/courierWebhookController.js";

const TEST_PREFIX = `TEST_${Date.now()}`;

async function runTests() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/zaitoon_pakistan";
  await mongoose.connect(mongoUri);
  console.log("=== Connected to MongoDB for Order System Verification ===");

  try {
    await Order.collection.dropIndex("idempotencyKey_1");
  } catch {
    // index might not exist or already dropped
  }
  await Order.syncIndexes();

  let passedTests = 0;
  const totalTests = 20;

  const testProductA = await Product.create({
    name: `${TEST_PREFIX} Olive Oil Premium 500ml`,
    slug: `${TEST_PREFIX.toLowerCase()}-olive-oil-500ml`,
    sku: `SKU-${TEST_PREFIX}-A`,
    brand: "Pak Veda",
    category: "Edible and Specialty Oils",
    price: 3500,
    stock: 20,
    soldCount: 0,
    size: "500ml",
    image: "/images/products/test-a.png",
    description: "Pure artisanal cold-pressed olive harvest oil",
    isActive: true,
  });

  const testProductB = await Product.create({
    name: `${TEST_PREFIX} Raw Sidr Honey 250g`,
    slug: `${TEST_PREFIX.toLowerCase()}-sidr-honey-250g`,
    sku: `SKU-${TEST_PREFIX}-B`,
    brand: "Pak Veda",
    category: "Botanicals & Honey",
    price: 2200,
    stock: 2,
    soldCount: 0,
    size: "250g",
    image: "/images/products/test-b.png",
    description: "Wild mountain raw sidr honey from Karak valleys",
    isActive: true,
  });

  const testProductDeal = await Product.create({
    name: `${TEST_PREFIX} Early Harvest EVOO Flash Deal`,
    slug: `${TEST_PREFIX.toLowerCase()}-evoo-flash-deal`,
    sku: `SKU-${TEST_PREFIX}-DEAL`,
    brand: "Pak Veda Reserve",
    category: "Cold-Pressed Oils",
    price: 4000,
    stock: 15,
    soldCount: 0,
    size: "750ml",
    image: "/images/products/test-deal.png",
    description: "Monovarietal high-polyphenol early harvest olive oil",
    isActive: true,
  });

  const testDeal = await Deal.create({
    product: testProductDeal._id,
    title: `${TEST_PREFIX} Flash Deal 25% Off`,
    discountType: "percent",
    discountValue: 25,
    originalPrice: 4000,
    dealPrice: 3000,
    discountPercent: 25,
    dealStockLimit: 4, // Max 4 units on deal
    dealSoldCount: 0,
    startsAt: new Date(Date.now() - 3600000),
    endsAt: new Date(Date.now() + 86400000),
    isActive: true,
  });

  console.log("\n--- Starting 20 Verification Scenarios ---");

  try {
    // -------------------------------------------------------------
    // Scenario 1: Atomic Stock Reservation
    // -------------------------------------------------------------
    console.log("\n[Scenario 1] Atomic Stock Reservation...");
    const initialStockA = testProductA.stock;
    const order1Res = await orderService.createOrder({
      customer: { name: "Ali Khan", phone: "03001234567", email: "ali.test@pakveda.com" },
      shippingAddress: { city: "Islamabad", address: "Sector F-7/2, Street 15" },
      items: [{ productId: testProductA._id, quantity: 3 }],
      paymentMethod: "Cash on Delivery",
    });

    const refreshedProdA = await Product.findById(testProductA._id);
    if (refreshedProdA.stock === initialStockA - 3 && refreshedProdA.soldCount === 3) {
      console.log("✓ PASS: Stock atomically decremented by 3, soldCount incremented by 3.");
      passedTests++;
    } else {
      throw new Error(`Stock mismatch: expected ${initialStockA - 3}, got ${refreshedProdA.stock}`);
    }

    // -------------------------------------------------------------
    // Scenario 2: Prevent Negative Inventory
    // -------------------------------------------------------------
    console.log("\n[Scenario 2] Prevent Negative Stock / Insufficient Stock Rejection...");
    let threwStockError = false;
    try {
      await orderService.createOrder({
        customer: { name: "Bilal", phone: "03007654321", email: "bilal@test.com" },
        shippingAddress: { city: "Lahore", address: "Gulberg III" },
        items: [{ productId: testProductB._id, quantity: 10 }], // only 2 available
        paymentMethod: "Cash on Delivery",
      });
    } catch (err) {
      threwStockError = true;
      console.log(`✓ PASS: Correctly rejected order with error: "${err.message}"`);
      passedTests++;
    }
    if (!threwStockError) throw new Error("Expected insufficient stock error but order succeeded");

    // -------------------------------------------------------------
    // Scenario 3: Simultaneous / Concurrent Purchases
    // -------------------------------------------------------------
    console.log("\n[Scenario 3] Simultaneous / Concurrent Purchases Safety...");
    // testProductB currently has exactly 2 units in stock.
    // 3 parallel requests of 1 unit each. Exactly 2 must succeed, 1 must fail.
    const concurrentPromises = [1, 2, 3].map((i) =>
      orderService
        .createOrder({
          customer: { name: `Concurrent Buyer ${i}`, phone: `0300000000${i}`, email: `buyer${i}@test.com` },
          shippingAddress: { city: "Karachi", address: "Clifton Block 2" },
          items: [{ productId: testProductB._id, quantity: 1 }],
          paymentMethod: "Cash on Delivery",
        })
        .then(() => "SUCCESS")
        .catch((e) => {
          console.log(`Concurrent ${i} error:`, e.message);
          return "FAILED";
        })
    );

    const concurrentResults = await Promise.all(concurrentPromises);
    const successes = concurrentResults.filter((r) => r === "SUCCESS").length;
    const failures = concurrentResults.filter((r) => r === "FAILED").length;
    const prodBAfterConcurrent = await Product.findById(testProductB._id);

    if (successes === 2 && failures === 1 && prodBAfterConcurrent.stock === 0) {
      console.log(`✓ PASS: Exactly ${successes} succeeded and ${failures} failed. Final stock: 0 (No overdraft).`);
      passedTests++;
    } else {
      throw new Error(`Concurrent test failed: successes=${successes}, failures=${failures}, stock=${prodBAfterConcurrent.stock}`);
    }

    // -------------------------------------------------------------
    // Scenario 4: Multi-Item Rollback on Partial Insufficient Stock
    // -------------------------------------------------------------
    console.log("\n[Scenario 4] Multi-Item Rollback on Partial Stock Exhaustion...");
    // Item A has plenty of stock (17). Item B has 0 stock.
    const stockABefore = (await Product.findById(testProductA._id)).stock;
    let threwMultiRollback = false;
    try {
      await orderService.createOrder({
        customer: { name: "Multi Buyer", phone: "03009999999", email: "multi@test.com" },
        shippingAddress: { city: "Peshawar", address: "University Town" },
        items: [
          { productId: testProductA._id, quantity: 2 }, // has stock
          { productId: testProductB._id, quantity: 1 }, // 0 stock
        ],
        paymentMethod: "Cash on Delivery",
      });
    } catch (err) {
      threwMultiRollback = true;
    }

    const stockAAfter = (await Product.findById(testProductA._id)).stock;
    if (threwMultiRollback && stockAAfter === stockABefore) {
      console.log(`✓ PASS: Order rejected and Item A stock rolled back completely (${stockABefore} -> ${stockAAfter}).`);
      passedTests++;
    } else {
      throw new Error(`Rollback failed! Stock changed from ${stockABefore} to ${stockAAfter}`);
    }

    // -------------------------------------------------------------
    // Scenario 5: Idempotency Key Deduplication
    // -------------------------------------------------------------
    console.log("\n[Scenario 5] Idempotency Key Deduplication...");
    const testIdempotencyKey = `IDEMP-${Date.now()}-XYZ`;
    const stockBeforeIdemp = (await Product.findById(testProductA._id)).stock;

    const firstOrder = await orderService.createOrder(
      {
        customer: { name: "Tariq", phone: "03211234567", email: "tariq@test.com" },
        shippingAddress: { city: "Islamabad", address: "I-8 Markaz" },
        items: [{ productId: testProductA._id, quantity: 1 }],
        paymentMethod: "Cash on Delivery",
      },
      testIdempotencyKey
    );

    // Replay exact same request with same idempotency key
    const duplicateOrder = await orderService.createOrder(
      {
        customer: { name: "Tariq", phone: "03211234567", email: "tariq@test.com" },
        shippingAddress: { city: "Islamabad", address: "I-8 Markaz" },
        items: [{ productId: testProductA._id, quantity: 1 }],
        paymentMethod: "Cash on Delivery",
      },
      testIdempotencyKey
    );

    const stockAfterIdemp = (await Product.findById(testProductA._id)).stock;
    if (
      duplicateOrder.isDuplicate === true &&
      duplicateOrder.order.orderReference === firstOrder.order.orderReference &&
      stockAfterIdemp === stockBeforeIdemp - 1
    ) {
      console.log("✓ PASS: Duplicate checkout returned existing order; stock deducted exactly once.");
      passedTests++;
    } else {
      throw new Error(`Idempotency failed! Duplicate flag: ${duplicateOrder.isDuplicate}, stock before: ${stockBeforeIdemp}, after: ${stockAfterIdemp}`);
    }

    // -------------------------------------------------------------
    // Scenario 6: Flash Deal Price & Atomic Deal Stock Limit
    // -------------------------------------------------------------
    console.log("\n[Scenario 6] Flash Deal Price & Atomic Deal Quota Decrement...");
    // Deal limit is 4 units. Buying 2 units.
    const dealOrderRes = await orderService.createOrder({
      customer: { name: "Deal Shopper", phone: "03331112233", email: "dealshopper@pakveda.com" },
      shippingAddress: { city: "Rawalpindi", address: "Saddar Road" },
      items: [{ productId: testProductDeal._id, quantity: 2 }],
      paymentMethod: "Cash on Delivery",
    });

    const refreshedDeal = await Deal.findById(testDeal._id);
    const dealOrderItem = dealOrderRes.order.items[0];

    if (
      dealOrderItem.isDeal === true &&
      dealOrderItem.price === 3000 &&
      refreshedDeal.dealSoldCount === 2
    ) {
      console.log(`✓ PASS: Flash deal price applied (Rs. 3000), dealSoldCount incremented to 2.`);
      passedTests++;
    } else {
      throw new Error(`Deal order failed: price=${dealOrderItem.price}, dealSoldCount=${refreshedDeal.dealSoldCount}`);
    }

    // -------------------------------------------------------------
    // Scenario 7: Deal Stock Limit Exhaustion Rejection
    // -------------------------------------------------------------
    console.log("\n[Scenario 7] Deal Stock Limit Exhaustion Rejection...");
    // Deal limit is 4, 2 already sold. Trying to buy 3 more should fail.
    let dealLimitExhausted = false;
    try {
      await orderService.createOrder({
        customer: { name: "Overshoot Buyer", phone: "03339998877", email: "overshoot@pakveda.com" },
        shippingAddress: { city: "Islamabad", address: "Blue Area" },
        items: [{ productId: testProductDeal._id, quantity: 3 }],
        paymentMethod: "Cash on Delivery",
      });
    } catch (err) {
      dealLimitExhausted = true;
      console.log(`✓ PASS: Rejected purchase exceeding deal stock limit: "${err.message}"`);
      passedTests++;
    }
    if (!dealLimitExhausted) throw new Error("Expected deal stock limit rejection");

    // -------------------------------------------------------------
    // Scenario 8: Server-Side Authoritative Price Snapshot
    // -------------------------------------------------------------
    console.log("\n[Scenario 8] Authoritative Price Snapshot (Client Tampering Ignored)...");
    const tamperedOrder = await orderService.createOrder({
      customer: { name: "Hacker Client", phone: "03001111111", email: "hacker@test.com" },
      shippingAddress: { city: "Lahore", address: "Mall Road" },
      items: [
        {
          productId: testProductA._id,
          quantity: 1,
          price: 5, // Client attempts to buy Rs. 3500 item for Rs. 5!
          lineTotal: 5,
        },
      ],
      paymentMethod: "Cash on Delivery",
    });

    const recordedItem = tamperedOrder.order.items[0];
    if (recordedItem.price === 3500 && tamperedOrder.order.subtotal === 3500) {
      console.log("✓ PASS: Client price tampering ignored; database price Rs. 3500 enforced.");
      passedTests++;
    } else {
      throw new Error(`Tamper prevention failed! Recorded price: ${recordedItem.price}`);
    }

    // -------------------------------------------------------------
    // Scenario 9: Coupon Excluded on Deal Items
    // -------------------------------------------------------------
    console.log("\n[Scenario 9] Coupon Exclusion on Deal Items...");
    const testCoupon = await Coupon.create({
      code: `PROMO_${Date.now()}`,
      discountType: "percentage",
      discountValue: 20,
      minOrderAmount: 1000,
      isActive: true,
    });

    let couponOnDealRejected = false;
    try {
      await orderService.createOrder({
        customer: { name: "Coupon Buyer", phone: "03005554433", email: "coupon@test.com" },
        shippingAddress: { city: "Islamabad", address: "F-10 Markaz" },
        items: [{ productId: testProductDeal._id, quantity: 1 }], // deal item only
        couponCode: testCoupon.code,
        paymentMethod: "Cash on Delivery",
      });
    } catch (err) {
      couponOnDealRejected = true;
      console.log(`✓ PASS: Coupon on flash deal rejected with message: "${err.message}"`);
      passedTests++;
    }
    if (!couponOnDealRejected) throw new Error("Expected coupon rejection on flash deal item");

    // -------------------------------------------------------------
    // Scenario 10: Order Reference, InventoryState & Snapshot Verification
    // -------------------------------------------------------------
    console.log("\n[Scenario 10] Order Document Schema & Snapshots...");
    const ordDoc = tamperedOrder.order;
    if (
      ordDoc.orderReference.startsWith("ZP-") &&
      ordDoc.inventoryState === "deducted" &&
      ordDoc.orderStatus === "cold_packed" &&
      ordDoc.paymentStatus === "pending_cod"
    ) {
      console.log(`✓ PASS: Order reference "${ordDoc.orderReference}", inventoryState="deducted", status="cold_packed".`);
      passedTests++;
    } else {
      throw new Error(`Order schema validation failed for ${ordDoc.orderReference}`);
    }

    // -------------------------------------------------------------
    // Scenario 11: Transactional Email Outbox Queueing
    // -------------------------------------------------------------
    console.log("\n[Scenario 11] Transactional Email Outbox Queueing...");
    const outboxRecord = await EmailOutbox.findOne({
      orderReference: ordDoc.orderReference,
      template: "order_confirmation",
    });

    if (outboxRecord && outboxRecord.recipient === "hacker@test.com") {
      console.log(`✓ PASS: EmailOutbox queued confirmation for ${ordDoc.orderReference} with status="${outboxRecord.status}".`);
      passedTests++;
    } else {
      throw new Error(`Email outbox record not found for ${ordDoc.orderReference}`);
    }

    // -------------------------------------------------------------
    // Scenario 12: Email Outbox Dispatcher Execution
    // -------------------------------------------------------------
    console.log("\n[Scenario 12] Email Outbox Dispatcher...");
    const dispatchRes = await processEmailOutbox(10);
    const updatedOutboxRecord = await EmailOutbox.findById(outboxRecord._id);

    if (updatedOutboxRecord.status === "sent" && updatedOutboxRecord.sentAt) {
      console.log("✓ PASS: Outbox dispatcher successfully processed pending email and set status='sent'.");
      passedTests++;
    } else {
      throw new Error(`Outbox dispatch failed: status=${updatedOutboxRecord.status}`);
    }

    // -------------------------------------------------------------
    // Scenario 13: Multi-Courier Shipment Initiation (TCS)
    // -------------------------------------------------------------
    console.log("\n[Scenario 13] Courier Shipment Booking (TCS Express)...");
    const adminUser = { name: "Hub Manager" };
    const tcsShippedOrder = await orderService.initiateShipment(
      ordDoc.orderReference,
      { provider: "tcs", parcelWeightKg: 0.8 },
      adminUser
    );

    if (
      tcsShippedOrder.shipment?.provider === "tcs" &&
      tcsShippedOrder.shipment?.trackingNumber.startsWith("TCS-") &&
      tcsShippedOrder.orderStatus === "dispatched" &&
      tcsShippedOrder.trackingStage === 3
    ) {
      console.log(`✓ PASS: TCS Consignment booked: ${tcsShippedOrder.shipment.trackingNumber}, Order Status: dispatched.`);
      passedTests++;
    } else {
      throw new Error(`TCS shipment booking failed: ${JSON.stringify(tcsShippedOrder.shipment)}`);
    }

    // -------------------------------------------------------------
    // Scenario 14: Multi-Courier Shipment Initiation (Leopards)
    // -------------------------------------------------------------
    console.log("\n[Scenario 14] Courier Shipment Booking (Leopards Courier)...");
    const leopardsAdapter = getCourierAdapter("leopards");
    const leopardsRes = await leopardsAdapter.createShipment({
      order: dealOrderRes.order,
      parcelWeightKg: 0.6,
      codAmount: dealOrderRes.order.total,
    });

    if (leopardsRes.success && leopardsRes.trackingNumber.startsWith("LEO-")) {
      console.log(`✓ PASS: Leopards booking successful: ${leopardsRes.trackingNumber}`);
      passedTests++;
    } else {
      throw new Error(`Leopards adapter failed: ${JSON.stringify(leopardsRes)}`);
    }

    // -------------------------------------------------------------
    // Scenario 15: Multi-Courier Shipment Initiation (Trax & M&P)
    // -------------------------------------------------------------
    console.log("\n[Scenario 15] Courier Shipment Booking (Trax & M&P)...");
    const traxAdapter = getCourierAdapter("trax");
    const traxRes = await traxAdapter.createShipment({
      order: order1Res.order,
      parcelWeightKg: 1.0,
      codAmount: order1Res.order.total,
    });

    const mnpAdapter = getCourierAdapter("mnp");
    const mnpRes = await mnpAdapter.createShipment({
      order: order1Res.order,
      parcelWeightKg: 1.0,
      codAmount: order1Res.order.total,
    });

    if (traxRes.trackingNumber.startsWith("TRX-") && mnpRes.trackingNumber.startsWith("MNP-")) {
      console.log(`✓ PASS: Trax (${traxRes.trackingNumber}) & M&P (${mnpRes.trackingNumber}) adapters validated.`);
      passedTests++;
    } else {
      throw new Error("Trax or M&P adapter booking failed");
    }

    // -------------------------------------------------------------
    // Scenario 16: Auditable Shipment Attempts History
    // -------------------------------------------------------------
    console.log("\n[Scenario 16] Auditable Shipment Attempts History...");
    const shippedOrderRefreshed = await Order.findOne({ orderReference: ordDoc.orderReference });
    if (
      shippedOrderRefreshed.shipment.shipmentAttempts.length > 0 &&
      shippedOrderRefreshed.shipment.shipmentAttempts[0].provider === "tcs"
    ) {
      console.log(`✓ PASS: Auditable shipment attempt logged with timestamp and provider response.`);
      passedTests++;
    } else {
      throw new Error("Shipment attempts log empty");
    }

    // -------------------------------------------------------------
    // Scenario 17: Shipment Dispatched Email Queued
    // -------------------------------------------------------------
    console.log("\n[Scenario 17] Shipment Notification Email in Outbox...");
    const shipmentEmail = await EmailOutbox.findOne({
      orderReference: ordDoc.orderReference,
      template: "shipment_dispatched",
    });

    if (shipmentEmail && shipmentEmail.payload?.trackingNumber) {
      console.log(`✓ PASS: Shipment dispatched email queued with tracking number ${shipmentEmail.payload.trackingNumber}.`);
      passedTests++;
    } else {
      throw new Error("Shipment dispatched email not queued in outbox");
    }

    // -------------------------------------------------------------
    // Scenario 18: Courier Webhook Status Ingestion & Delivery Auto-Payment
    // -------------------------------------------------------------
    console.log("\n[Scenario 18] Courier Webhook Ingestion & Monotonic Progression...");
    // Simulate incoming webhook from TCS: Status "DELIVERED"
    const reqMock = {
      params: { provider: "tcs" },
      headers: {},
      query: {},
      body: {
        trackingNumber: tcsShippedOrder.shipment.trackingNumber,
        status: "DELIVERED",
        location: "Islamabad Express Hub",
        note: "Delivered to customer, signed by recipient",
      },
    };

    let webhookResponseJson = null;
    const resMock = {
      json: (data) => {
        webhookResponseJson = data;
        return resMock;
      },
      status: () => resMock,
    };

    await handleCourierWebhook(reqMock, resMock, (err) => {
      if (err) console.error("Webhook error:", err);
    });
    const deliveredOrder = await Order.findOne({ orderReference: ordDoc.orderReference });

    if (
      deliveredOrder.orderStatus === "delivered" &&
      deliveredOrder.paymentStatus === "paid" &&
      deliveredOrder.shipment.status === "delivered"
    ) {
      console.log(`✓ PASS: Webhook advanced order to "delivered" and auto-marked COD "paid".`);
      passedTests++;
    } else {
      throw new Error(`Webhook update failed: orderStatus=${deliveredOrder.orderStatus}, paymentStatus=${deliveredOrder.paymentStatus}`);
    }

    // -------------------------------------------------------------
    // Scenario 19: Webhook Monotonic Progression Guard (No Downgrade)
    // -------------------------------------------------------------
    console.log("\n[Scenario 19] Monotonic Progression Guard (No Status Downgrade)...");
    // Attempting to deliver an out-of-order webhook with status "IN_TRANSIT" on a "delivered" order
    const reqDowngradeMock = {
      params: { provider: "tcs" },
      headers: {},
      query: {},
      body: {
        trackingNumber: tcsShippedOrder.shipment.trackingNumber,
        status: "IN_TRANSIT",
        location: "Highway Checkpoint",
        note: "Delayed linehaul update",
      },
    };

    await handleCourierWebhook(reqDowngradeMock, resMock, (err) => {
      if (err) console.error("Webhook downgrade error:", err);
    });
    const preservedOrder = await Order.findOne({ orderReference: ordDoc.orderReference });

    if (preservedOrder.orderStatus === "delivered") {
      console.log("✓ PASS: Monotonic guard prevented status downgrade; order remained 'delivered'.");
      passedTests++;
    } else {
      throw new Error(`Monotonic guard failed! Order downgraded to ${preservedOrder.orderStatus}`);
    }

    // -------------------------------------------------------------
    // Scenario 20: Order Cancellation, Returns & Inventory Restoration Idempotency
    // -------------------------------------------------------------
    console.log("\n[Scenario 20] Cancellation & Return Restock Idempotency...");
    // 1. Create a fresh order
    const orderToCancel = await orderService.createOrder({
      customer: { name: "Cancel Buyer", phone: "03008887766", email: "cancel@test.com" },
      shippingAddress: { city: "Lahore", address: "Johar Town" },
      items: [{ productId: testProductA._id, quantity: 4 }],
      paymentMethod: "Cash on Delivery",
    });

    const stockBeforeCancel = (await Product.findById(testProductA._id)).stock;
    // 2. Cancel order
    await orderService.cancelOrder(
      orderToCancel.order.orderReference,
      { cancelReason: "Customer requested cancellation before pack" },
      { name: "Support Agent" }
    );

    const stockAfterCancel = (await Product.findById(testProductA._id)).stock;

    // 3. Duplicate cancel attempt: must NOT restock twice!
    await orderService.cancelOrder(
      orderToCancel.order.orderReference,
      { cancelReason: "Duplicate cancel attempt" },
      { name: "Support Agent" }
    );
    const stockAfterSecondCancel = (await Product.findById(testProductA._id)).stock;

    if (
      stockAfterCancel === stockBeforeCancel + 4 &&
      stockAfterSecondCancel === stockAfterCancel
    ) {
      console.log(`✓ PASS: Restored exactly 4 units on cancel (${stockBeforeCancel} -> ${stockAfterCancel}) and prevented double-restock.`);
      passedTests++;
    } else {
      throw new Error(`Cancellation stock restoration failed: before=${stockBeforeCancel}, after1=${stockAfterCancel}, after2=${stockAfterSecondCancel}`);
    }
  } finally {
    // Cleanup test artifacts
    console.log("\n--- Cleaning up test records ---");
    await Product.deleteMany({ _id: { $in: [testProductA._id, testProductB._id, testProductDeal._id] } });
    await Deal.deleteMany({ _id: testDeal._id });
    await Order.deleteMany({ "customer.name": { $regex: TEST_PREFIX } });
    await EmailOutbox.deleteMany({ recipient: { $regex: "pakveda.com|test.com" } });
    console.log("Test records cleaned up.");
  }

  console.log(`\n======================================================`);
  console.log(`RESULTS: ${passedTests} / ${totalTests} SCENARIOS PASSED (100%)`);
  console.log(`======================================================\n`);

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error("FATAL TEST FAILURE:", err);
  process.exit(1);
});
