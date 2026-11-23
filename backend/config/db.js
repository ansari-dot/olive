import mongoose from "mongoose";
import { env } from "./env.js";


const CLIENT_OPTIONS = {
  maxPoolSize: 100,
  minPoolSize: 10,
  maxIdleTimeMS: 60_000,
  waitQueueTimeoutMS: 10_000,
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 45_000,
  compressors: "zlib",
  // For Mongo 4.0+ this is the default; pinning it makes intent explicit.
  retryWrites: true,
  retryReads: true,
};

export async function connectDB() {
  const uri = env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is required");

  // Mongoose-level tuning.
  // Default strict query is already true in mongoose 7+, but pin it.
  mongoose.set("strictQuery", true);
  // Fail buffered ops quickly when the connection drops instead of hanging
  // request threads for the full default (~10s) until they time out.
  mongoose.set("bufferTimeoutMS", 10_000);
  // We run our own index sync explicitly via `syncIndexes()` below — disable
  // the implicit `ensureIndexes` on model registration so startup is fast and
  // we have a single source of truth for index lifecycle.
  mongoose.set("autoIndex", false);

  try {
    await mongoose.connect(uri, CLIENT_OPTIONS);
    console.log(
      `MongoDB connected (pool ${CLIENT_OPTIONS.minPoolSize}-${CLIENT_OPTIONS.maxPoolSize})`
    );
    return true;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    throw err;
  }
}

/**
 * Reconcile model-declared indexes with what exists in MongoDB:
 *  - Builds any new compound indexes declared in models.
 *  - Drops indexes that no longer exist in the schema.
 *
 * This is the safe replacement for `autoIndex`. It only mutates index
 * metadata, never document data. Failures are logged but don't crash startup
 * (e.g. a non-admin user without `dropIndex` privilege).
 */
export async function syncAllIndexes() {
  const start = Date.now();
  const results = [];
  for (const [name, model] of Object.entries(mongoose.models)) {
    try {
      const dropped = await model.syncIndexes();
      results.push({ model: name, droppedOrChanged: dropped });
    } catch (err) {
      console.warn(`syncIndexes(${name}) failed:`, err.message);
    }
  }
  const ms = Date.now() - start;
  const changed = results.filter((r) => r.droppedOrChanged && r.droppedOrChanged.length);
  if (changed.length === 0) {
    console.log(`Indexes already in sync (${ms}ms)`);
  } else {
    console.log(`Indexes synced in ${ms}ms — changes:`);
    for (const r of changed) {
      console.log(`  • ${r.model}: dropped/replaced ${r.droppedOrChanged.join(", ")}`);
    }
  }
}
