import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { env } from "../config/env.js";

/**
 * Sensible rate-limit presets. We use a custom JSON 429 handler so clients
 * receive the standard error envelope (`{ message, details? }`) instead of
 * the library's default text body.
 */
const jsonHandler = (_req, res /*, next, options */) => {
  res.status(429).json({
    message: "Too many requests, please slow down",
  });
};

function buildLimiter({ windowMs, max, skipSuccessful = false }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: jsonHandler,
    skipSuccessfulRequests: skipSuccessful,
    // Use the library's IPv6-safe helper when behind a trusted proxy.
    keyGenerator: (req) =>
      env.TRUST_PROXY
        ? ipKeyGenerator(req.ip)
        : ipKeyGenerator(req.socket.remoteAddress || req.ip),
  });
}

// Strict — login is brute-force sensitive.
export const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessful: true,
});

// Public write endpoints (contact form, newsletter, consultations, reviews,
// payments init). Generous enough for real users but tight enough to deter
// abuse from a single IP.
export const publicWriteLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
});

// Global default for everything else.
export const globalLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 600,
});
