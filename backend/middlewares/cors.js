import { env } from "../config/env.js";

const ALLOWED_ORIGINS = [
  env.CORS_ORIGINS,
  env.CLIENT_URL,
  env.SUB_CLIENT_URL,
  env.ADMIN_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
]
  .filter(Boolean)
  .flatMap((origin) => origin.split(","))
  .map((s) => s.trim())
  .filter(Boolean);

export function cors(req, res, next) {
  const origin = req.headers.origin;

  if (origin) {
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      (!env.IS_PROD && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
    ) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Admin-Token"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
}

export default cors;
