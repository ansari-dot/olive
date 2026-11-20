import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import DealSection from "../models/DealSection.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zaitoon_pakistan";

async function clearDummyProducts() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB:", MONGODB_URI);

  // Remove dummy/seed products
  const result = await Product.deleteMany({});
  console.log(`Deleted ${result.deletedCount} dummy products from MongoDB.`);

  // Clean reviews for old products
  const revResult = await Review.deleteMany({});
  console.log(`Deleted ${revResult.deletedCount} reviews for old products.`);

  // Reset DealSection products array if any
  await DealSection.updateMany({}, { $set: { products: [] } });
  console.log("Reset DealSection product references.");

  console.log("All dummy product data has been successfully removed!");
  console.log("Now only products created through the Admin Panel will be displayed.");

  await mongoose.disconnect();
}

clearDummyProducts().catch((err) => {
  console.error("Failed to clear products:", err);
  process.exit(1);
});
