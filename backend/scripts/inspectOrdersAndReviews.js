import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/zaitoon_pakistan";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  const orders = await Order.find({}).lean();
  console.log(`Found ${orders.length} orders in DB.`);
  orders.slice(0, 5).forEach((o) => {
    console.log({
      ref: o.orderReference,
      customerEmail: o.customer?.email,
      customerName: o.customer?.name,
      status: o.orderStatus,
      items: o.items?.map((it) => ({
        product: it.product,
        slug: it.slug,
        name: it.name,
      })),
    });
  });

  const reviews = await Review.find({}).lean();
  console.log(`Found ${reviews.length} reviews in DB.`);
  reviews.forEach((r) => {
    console.log({
      id: r._id,
      product: r.product,
      author: r.author,
      rating: r.rating,
      comment: r.comment,
    });
  });

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
