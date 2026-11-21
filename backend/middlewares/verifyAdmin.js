import { env } from "../config/env.js";
import { verifySessionToken } from "../services/authService.js";

/**
 * Validates the admin session.
 * Prioritizes HttpOnly session cookies, falling back to Authorization headers for API/test tools.
 */
export async function verifyAdmin(req, res, next) {
  try {
    let token = "";

    // 1. Primary secure channel: HttpOnly session cookie
    if (req.cookies && req.cookies[env.COOKIE.NAME]) {
      token = req.cookies[env.COOKIE.NAME];
    }

    // 2. Secondary fallback: Authorization header (for headless testing/API clients)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }
    }

    // 3. Tertiary fallback: X-Admin-Token header
    if (!token && req.headers["x-admin-token"]) {
      token = String(req.headers["x-admin-token"]).trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Admin session required",
      });
    }

    const meta = {
      ipAddress: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
    };

    const { admin, session, auth } = await verifySessionToken(token, meta);

    req.admin = admin;
    req.session = session;
    req.auth = auth;

    return next();
  } catch (err) {
    const status = err.statusCode || err.status || 401;
    return res.status(status).json({
      success: false,
      message: err.message || "Unauthorized: Invalid or expired admin session",
    });
  }
}

export const requireAdmin = verifyAdmin;

export default verifyAdmin;
