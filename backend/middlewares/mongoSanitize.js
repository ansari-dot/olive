import { deepSanitize } from "../utils/security.js";

/**
 * Express middleware to prevent NoSQL query injection attacks.
 * Strips MongoDB operators (keys starting with $) and prototype pollution keys
 * from req.body, req.query, and req.params before reaching controllers.
 */
export function mongoSanitize(req, _res, next) {
  if (req.body) deepSanitize(req.body);
  if (req.params) deepSanitize(req.params);

  // In Express 5, req.query may have property getters; handle carefully
  if (req.query) {
    try {
      deepSanitize(req.query);
    } catch {
      // If req.query is non-extensible, create sanitized clone and define property
      const cloned = deepSanitize({ ...req.query });
      Object.defineProperty(req, "query", {
        value: cloned,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
  }

  next();
}

export default mongoSanitize;
