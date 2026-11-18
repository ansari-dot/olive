import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import AdminUser from "../models/AdminUser.js";

export async function verifyAdmin(req, res, next) {
  try {
    let token = "";

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    // 2. Check HttpOnly cookie
    if (!token && req.cookies && req.cookies[env.COOKIE.NAME]) {
      token = req.cookies[env.COOKIE.NAME];
    }

    // 3. Check X-Admin-Token header
    if (!token && req.headers["x-admin-token"]) {
      token = String(req.headers["x-admin-token"]).trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Admin authentication token required",
      });
    }

    const decoded = jwt.verify(token, env.JWT.SECRET);
    const adminId = decoded.sub || decoded.id || decoded._id;

    const admin = await AdminUser.findById(adminId).select("-password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Admin account not found",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin account is inactive",
      });
    }

    req.admin = admin;
    req.auth = {
      sub: String(admin._id),
      id: String(admin._id),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired admin token",
    });
  }
}

export const requireAdmin = verifyAdmin;

export default verifyAdmin;
