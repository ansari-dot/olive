import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";

const STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

const bootedAt = Date.now();

/**
 * Liveness check — answers immediately even if Mongo is down. Useful for
 * Kubernetes/`docker-compose` health probes that should NOT mark the pod
 * unhealthy just because Mongo blipped.
 */
export const liveness = asyncHandler(async (_req, res) => {
  res.json({
    status: "ok",
    uptimeMs: Date.now() - bootedAt,
  });
});

/**
 * Readiness check — verifies Mongo is reachable and responsive. Returns 503
 * when not ready so load balancers can drain traffic.
 */
export const readiness = asyncHandler(async (_req, res) => {
  const state = mongoose.connection.readyState;
  let dbOk = state === 1;
  let pingMs = null;
  if (dbOk) {
    const start = Date.now();
    try {
      await mongoose.connection.db.admin().ping();
      pingMs = Date.now() - start;
    } catch {
      dbOk = false;
    }
  }
  const status = dbOk ? "ok" : "degraded";
  res.status(dbOk ? 200 : 503).json({
    status,
    uptimeMs: Date.now() - bootedAt,
    mongo: {
      state: STATES[state] || "unknown",
      pingMs,
    },
    node: process.version,
  });
});
