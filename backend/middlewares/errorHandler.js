import { ZodError } from "zod";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

const RED = "\x1b[31m";
const RESET = "\x1b[0m";

export function notFound(_req, _res, next) {
  next(ApiError.notFound("Route not found"));
}

/**
 * Centralized error handler. Converts known error types into JSON responses
 * with consistent shape: `{ message, details? }`.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = 500;
  let message = "Internal Server Error";
  let details;

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    message = "Validation failed";
    details = err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
      code: i.code,
    }));
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err?.code === 11000) {
    status = 409;
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    message = fields.length
      ? `Duplicate value for ${fields.join(", ")}`
      : "Duplicate key";
    details = err.keyValue;
  } else if (err?.statusCode) {
    status = err.statusCode;
    message = err.message || message;
  } else if (err?.message) {
    message = err.message;
  }

  if (status >= 500) {
    // Log unexpected errors with stack on server console for observability.
    console.error(`${RED}[error]${RESET} ${req.method} ${req.originalUrl}:`, err);
    // Never leak stack trace or internal database/system exceptions to clients in production
    if (env.IS_PROD) {
      message = "Internal Server Error";
      details = undefined;
    }
  }

  res.status(status).json({ message, ...(details ? { details } : {}) });
}

export default errorHandler;
