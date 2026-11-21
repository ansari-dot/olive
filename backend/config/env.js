import crypto from "crypto";
import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const isProd = (process.env.NODE_ENV || "development") === "production";

/**
 * Provide a JWT secret. In production we require an explicit `JWT_SECRET`
 * env var — failing fast at boot is safer than rotating secrets per restart.
 * In development we generate a stable-per-process secret and log a warning so
 * the developer notices and can set one in `.env`.
 */
function resolveJwtSecret() {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (isProd) {
    throw new Error(
      "JWT_SECRET is required in production (set a long, random value in .env)"
    );
  }
  const generated = crypto.randomBytes(48).toString("hex");
  console.warn(
    "[env] JWT_SECRET not set — using a per-process random secret. Tokens will become invalid on restart. Set JWT_SECRET in .env."
  );
  return generated;
}

export const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PROD: isProd,
  MONGO_URI: process.env.MONGO_URI,

  CLIENT_URL: process.env.CLIENT_URL || "",
  SUB_CLIENT_URL: process.env.SUB_CLIENT_URL || "",
  ADMIN_URL: process.env.ADMIN_URL || "",
  SERVER_URL: process.env.SERVER_URL || "",
  CORS_ORIGINS: process.env.CORS_ORIGINS || "",

  REQUEST_BODY_LIMIT: process.env.REQUEST_BODY_LIMIT || "100kb",
  LOG_FORMAT: (process.env.LOG_FORMAT || (isProd ? "json" : "pretty")).toLowerCase(),
  TRUST_PROXY: process.env.TRUST_PROXY === "true",

  JWT: {
    SECRET: resolveJwtSecret(),
    // Session lifetime — kept tight per security policy.
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || "3h",
    EXPIRES_IN_MS: 3 * 60 * 60 * 1000,
  },

  COOKIE: {
    NAME: process.env.AUTH_COOKIE_NAME || "admin_session",
    // `SameSite=none` (with Secure) is needed when the admin panel is on a
    // different origin from the API in production. Defaults to `lax` for dev.
    SAME_SITE: (process.env.COOKIE_SAME_SITE || (isProd ? "none" : "lax")).toLowerCase(),
    SECURE: process.env.COOKIE_SECURE === "true" || isProd,
    DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  },

  // Bootstrap-only credentials: used exactly once, on first run, to seed the
  // very first admin row in MongoDB. Subsequent logins read from the DB.
  ADMIN_BOOTSTRAP: {
    USERNAME: process.env.ADMIN_USERNAME || "",
    EMAIL: process.env.ADMIN_EMAIL || "",
    PASSWORD: process.env.ADMIN_PASSWORD || "",
    NAME: process.env.ADMIN_NAME || "Administrator",
  },

  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
    API_KEY: process.env.CLOUDINARY_API_KEY || "",
    API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
    PRODUCT_FOLDER: process.env.CLOUDINARY_PRODUCT_FOLDER || "myshop/products",
  },

  PAYFAST: {
    URL: process.env.PAYFAST_URL || "https://sandbox.payfast.co.za/eng/process",
    MERCHANT_ID: process.env.PAYFAST_MERCHANT_ID || "10058885",
    MERCHANT_KEY: process.env.PAYFAST_MERCHANT_KEY || "e43ad0kpt2n2t",
    PASSPHRASE: process.env.PAYFAST_PASSPHRASE || "",
    DEBUG: process.env.PAYFAST_DEBUG === "true",
    // PayFast publishes the IPN source IPs — keep them togglable so dev/
    // sandbox traffic isn't blocked.
    VERIFY_IP: process.env.PAYFAST_VERIFY_IP === "true",
    // Hit PayFast's /eng/query/validate to double-check the IPN payload.
    VERIFY_POSTBACK: process.env.PAYFAST_VERIFY_POSTBACK === "true",
  },

  SMTP: {
    HOST: process.env.SMTP_HOST || "",
    PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    USER: process.env.SMTP_USER || "",
    PASS: process.env.SMTP_PASS || "",
    FROM: process.env.SMTP_FROM || "orders@zaitoonpakistan.pk",
    SECURE: process.env.SMTP_SECURE === "true",
  },

  COURIER: {
    ACTIVE_PROVIDER: process.env.COURIER_ACTIVE_PROVIDER || "mock",
    WEBHOOK_SECRET: process.env.COURIER_WEBHOOK_SECRET || "zaitoon-courier-webhook-secret-2026",
    TCS: {
      API_KEY: process.env.TCS_API_KEY || "",
      API_URL: process.env.TCS_API_URL || "https://apis.tcsexpress.com",
      CLIENT_ID: process.env.TCS_CLIENT_ID || "",
      COST_CENTER_CODE: process.env.TCS_COST_CENTER_CODE || "",
    },
    LEOPARDS: {
      API_KEY: process.env.LEOPARDS_API_KEY || "",
      API_PASSWORD: process.env.LEOPARDS_API_PASSWORD || "",
      API_URL: process.env.LEOPARDS_API_URL || "https://merchantapi.leopardscourier.com",
    },
    TRAX: {
      API_KEY: process.env.TRAX_API_KEY || "",
      API_URL: process.env.TRAX_API_URL || "https://sonic.pk/api",
    },
    MNP: {
      USERNAME: process.env.MNP_USERNAME || "",
      PASSWORD: process.env.MNP_PASSWORD || "",
      ACCOUNT_NO: process.env.MNP_ACCOUNT_NO || "",
      API_URL: process.env.MNP_API_URL || "https://cod.mulphilog.com/api",
    },
  },
};

export default env;
