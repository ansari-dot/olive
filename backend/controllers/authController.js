import * as authService from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";

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
  const { token, expiresInMs, admin } = await authService.loginAdmin(req.body);
  res.cookie(env.COOKIE.NAME, token, buildCookieOptions(expiresInMs));
  res.json({
    success: true,
    token,
    admin,
    expiresInMs,
  });
});

export const logout = asyncHandler(async (_req, res) => {
  res.cookie(env.COOKIE.NAME, "", buildCookieOptions(0));
  res.json({ success: true, message: "Logged out successfully" });
});

export const me = asyncHandler(async (req, res) => {
  const admin = req.admin || req.auth;
  res.json({
    success: true,
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
