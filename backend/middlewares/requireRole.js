import { ApiError } from "../utils/ApiError.js";

export const ROLE_PERMISSIONS = {
  super_admin: ["*"],
  hub_manager: [
    "dashboard:read",
    "orders:read",
    "orders:dispatch",
    "orders:update",
    "orders:return",
    "orders:cancel",
    "products:read",
    "products:stock",
    "categories:read",
    "deals:read",
    "coupons:read",
    "blogs:read",
    "reviews:read",
    "reviews:moderate",
    "inquiries:read",
    "inquiries:update",
    "newsletter:read",
  ],
};

/**
 * Middleware factory requiring that the authenticated admin has one of the specified roles.
 * @param {...string} allowedRoles Roles allowed to access the endpoint (e.g. 'super_admin')
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const admin = req.admin || req.auth;
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Admin session required",
      });
    }

    const currentRole = admin.role || "hub_manager";

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Action restricted to [${allowedRoles.join(", ")}]. Current role: ${currentRole}`,
      });
    }

    return next();
  };
}

/**
 * Middleware factory requiring a specific fine-grained permission.
 * @param {string} permission Specific permission string (e.g. 'orders:delete_all')
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    const admin = req.admin || req.auth;
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Admin session required",
      });
    }

    const currentRole = admin.role || "hub_manager";
    const granted = ROLE_PERMISSIONS[currentRole] || [];

    if (granted.includes("*") || granted.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: Insufficient permissions for "${permission}". Current role: ${currentRole}`,
    });
  };
}

export default requireRole;
