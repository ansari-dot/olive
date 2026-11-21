import * as authService from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";
import { logAdminAction } from "../services/auditService.js";
import { ApiResponse } from "../utils/ApiResponse.js";

function buildCookieOptions(maxAgeMs) {
  const sameSite = env.COOKIE.SAME_SITE;
  const secure = sameSite === "none" ? true : env.COOKIE.SECURE;
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: maxAgeMs,
    ...(env.COOKIE.DOMAIN ? { domain: env.COOKIE.DOMAIN } : {}),
  };
}

export const login = asyncHandler(async (req, res) => {
  const meta = {
    ipAddress: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
    userAgent: req.headers["user-agent"] || "",
  };

  const { sessionToken, expiresInMs, admin } = await authService.loginAdmin(req.body, meta);

  // Set the cryptographically secure opaque session identifier strictly in an HttpOnly cookie
  res.cookie(env.COOKIE.NAME, sessionToken, buildCookieOptions(expiresInMs));

  logAdminAction({
    admin,
    action: "admin:login",
    targetResource: "AdminUser",
    targetId: admin._id,
    details: { email: admin.email, ipAddress: meta.ipAddress },
  });

  return ApiResponse.success(res, {
    admin,
    token: sessionToken, // Provided for headless testing compatibility
    expiresInMs,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const cookieToken = req.cookies?.[env.COOKIE.NAME];
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;
  const headerToken = req.headers["x-admin-token"];
  const token = cookieToken || bearerToken || headerToken;

  if (token) {
    await authService.revokeSession(token, "User initiated logout");
    logAdminAction({
      req,
      action: "admin:logout",
      targetResource: "AdminUser",
      targetId: req.admin?._id || req.auth?.id || "",
    });
  }

  // Clear session cookie
  res.cookie(env.COOKIE.NAME, "", buildCookieOptions(0));

  return ApiResponse.success(res, {}, "Logged out successfully");
});

export const me = asyncHandler(async (req, res) => {
  const admin = req.admin || req.auth;
  return ApiResponse.success(res, {
    admin: {
      _id: admin._id || admin.id || admin.sub,
      id: admin._id || admin.id || admin.sub,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
    },
  });
});
