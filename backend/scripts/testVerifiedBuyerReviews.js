import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import { addProductReview, getProductByIdOrSlug } from "../services/productService.js";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/zaitoon_pakistan";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  const prods = await Product.find({ isActive: true }).lean();
  console.log(`Found ${prods.length} active products in DB.`);
  if (prods.length === 0) {
    console.error("No active products in DB");
    await mongoose.disconnect();
    return;
  }
  const sampleProduct = prods[0];
  const slug = sampleProduct.slug;
  console.log(`Using sample product for review tests: "${sampleProduct.name}" (slug: "${slug}", id: "${sampleProduct._id}")`);

  // Ensure there is a test order in the DB for this product so we can test verified buyer flow
  const testEmail = "verified.shopper@pakveda.com";
  let testOrder = await Order.findOne({
    "customer.email": testEmail,
    "items.slug": slug,
  });

  if (!testOrder) {
    testOrder = await Order.create({
      orderReference: `PV-${Date.now().toString().slice(-4)}`,
      customer: {
        name: "Verified Shopper",
        email: testEmail,
        phone: "+923001234567",
      },
      shippingAddress: {
        city: "Lahore",
        address: "DHA Phase 5",
      },
      items: [
        {
          product: sampleProduct._id,
          slug: sampleProduct.slug,
          name: sampleProduct.name,
          size: sampleProduct.size || "500ml",
          price: sampleProduct.price,
          quantity: 1,
          lineTotal: sampleProduct.price,
        },
      ],
      paymentMethod: "Cash on Delivery",
      paymentStatus: "pending_cod",
      orderStatus: "delivered",
      subtotal: sampleProduct.price,
      shippingFee: 0,
      total: sampleProduct.price,
    });
    console.log(`Created test order for verified buyer test: ${testOrder.orderReference}`);
  } else {
    console.log(`Existing test order found: ${testOrder.orderReference}`);
  }

  // Test 1: Stranger who never purchased this product tries to review
  console.log("\n--- TEST 1: Unverified buyer rejection ---");
  try {
    await addProductReview(slug, {
      author: "Random Visitor",
      email: "stranger.unverified@gmail.com",
      rating: 5,
      comment: "Looks cool but never ordered it.",
    });
    console.error("FAIL: Should have blocked unverified customer!");
  } catch (err) {
    console.log("SUCCESS: Blocked unverified customer with error message:");
    console.log(" ->", err.message);
  }

  // Test 2: Verified buyer who ordered in testOrder
  console.log("\n--- TEST 2: Verified buyer submission ---");
  const res = await addProductReview(slug, {
    author: "Verified Shopper",
    email: testEmail,
    rating: 5,
    comment: "Extraordinary quality! The natural aroma and cold-pressed purity are undeniable.",
  });
  console.log("SUCCESS: Verified review submitted:", {
    reviewId: res.review._id,
    author: res.review.author,
    verifiedPurchase: res.review.verifiedPurchase,
    orderReference: res.review.orderReference,
    rating: res.rating,
    reviewsCount: res.reviewsCount,
  });

  // Test 3: Inspect Product from DB
  console.log("\n--- TEST 3: Product stats in DB ---");
  const prodData = await getProductByIdOrSlug(slug, true);
  console.log("Product in DB:", {
    name: prodData.product.name,
    rating: prodData.product.rating,
    reviewsCount: prodData.product.reviewsCount,
    reviewsInDetail: prodData.reviews.length,
  });

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
