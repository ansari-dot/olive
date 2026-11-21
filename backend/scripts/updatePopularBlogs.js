import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import BlogPost from "../models/BlogPost.js";

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zaitoon_pakistan";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  const blogs = await BlogPost.find({}).sort({ createdAt: -1 });
  console.log(`Found ${blogs.length} blog posts in DB.`);

  // Mark existing 6 blogs as isPopular: true
  const updated = await BlogPost.updateMany(
    {},
    { $set: { isPopular: true } }
  );
  console.log("Updated blog posts:", updated);

  const verify = await BlogPost.find({}, "title slug isPopular isPublished");
  console.log("Current blogs with isPopular status:", verify);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
