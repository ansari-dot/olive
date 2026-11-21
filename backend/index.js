// Load environment variables before anything else so every module sees them.
import "./config/env.js";

import mongoose from "mongoose";
import app from "./app.js";
import { env } from "./config/env.js";
import { startBackgroundSupervisor, stopBackgroundSupervisor } from "./workers/backgroundSupervisor.js";

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  warmupCache();
  startBackgroundSupervisor(60_000);
});

// Pre-populate server cache so first real visitor gets instant responses.
async function warmupCache() {
  const base = `http://localhost:${PORT}`;
  const routes = [
    "/api/home",
    "/api/products/navigation",
    "/api/products?limit=50",
    "/api/categories",
    "/api/hero-banner",
    "/api/home-collection",
    "/api/popular-picks",
    "/api/deal-section",
    "/api/category-sections",
    "/api/testimonials?active=true",
    "/api/compare-section",
  ];
  for (const route of routes) {
    try {
      await fetch(`${base}${route}`);
    } catch {
      // ignore — server may not be fully ready yet
    }
  }
  console.log("Cache warmed up");
}

/**
 * Graceful shutdown:
 *   1. Stop accepting new connections.
 *   2. Wait for in-flight requests to finish (with a hard timeout).
 *   3. Close the Mongo connection cleanly.
 * Required for zero-downtime deploys behind any process manager (PM2, k8s).
 */
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[${signal}] graceful shutdown initiated`);
  stopBackgroundSupervisor();

  const forceKill = setTimeout(() => {
    console.error("Forcing exit after 15s timeout");
    process.exit(1);
  }, 15_000);
  forceKill.unref();

  server.close(async (err) => {
    if (err) console.error("HTTP server close error:", err);
    try {
      await mongoose.disconnect();
      console.log("Mongo disconnected");
    } catch (e) {
      console.error("Mongo disconnect error:", e.message);
    }
    process.exit(err ? 1 : 0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Last-resort safety nets — log and continue rather than silently crashing.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown("uncaughtException");
});
