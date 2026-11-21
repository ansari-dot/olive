import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import { listProducts } from "../services/productService.js";

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/zaitoon_pakistan";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  // Test 1: Category filter 'All Categories' should return all active products
  const resAll = await listProducts({ category: "All Categories" });
  console.log("All Categories total:", resAll.total);

  // Test 2: Category filter with an actual category
  const resCat = await listProducts({ category: "Olive Products" });
  console.log("Olive Products total:", resCat.total);

  // Test 3: Search with keyword and category
  const resSearch = await listProducts({ search: "reserve", category: "Olive Products" });
  console.log("Search 'reserve' in 'Olive Products':", resSearch.total, resSearch.products.map(p => p.name));

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
