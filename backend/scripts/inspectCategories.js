import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import Category from "../models/Category.js";

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/zaitoon_pakistan";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  const categories = await Category.find({}).sort({ categoryNumber: 1, name: 1 }).lean();
  console.log(`Found ${categories.length} categories in DB.`);
  console.log(categories.map((c) => ({ num: c.categoryNumber, name: c.name, subcats: c.subcategories?.length })));

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
