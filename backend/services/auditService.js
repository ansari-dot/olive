import AuditLog from "../models/AuditLog.js";

const SENSITIVE_KEY_REGEX = /password|secret|token|passphrase|authorization|cookie|card|cvv|key/i;

function maskSensitiveData(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitiveData);

  const cleaned = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEY_REGEX.test(k)) {
      cleaned[k] = "******";
    } else if (v && typeof v === "object") {
      cleaned[k] = maskSensitiveData(v);
    } else {
      cleaned[k] = v;
    }
  }
  return cleaned;
}

/**
 * Records a sensitive administrative action into the immutable audit trail.
 */
export async function logAdminAction({
  req = null,
  admin = null,
  action,
  targetResource,
  targetId = "",
  details = {},
}) {
  try {
    const actor = admin || req?.admin || req?.auth || {};
    const ipAddress =
      req?.ip ||
      req?.headers?.["x-forwarded-for"] ||
      req?.socket?.remoteAddress ||
      "";
    const userAgent = req?.headers?.["user-agent"] || "";

    const safeDetails = maskSensitiveData(details);

    return await AuditLog.create({
      adminId: actor._id || actor.id || null,
      adminName: actor.name || "System Admin",
      adminEmail: actor.email || "",
      adminRole: actor.role || "super_admin",
      action,
      targetResource,
      targetId: String(targetId || "").trim(),
      ipAddress: String(ipAddress).trim(),
      userAgent: String(userAgent).trim(),
      details: safeDetails,
      timestamp: new Date(),
    });
  } catch (err) {
    // Non-blocking: audit logging failures must not abort core business operations
    console.error("[AuditService] Failed to record audit log entry:", err.message);
    return null;
  }
}

/**
 * Queries paginated audit logs with flexible filtering for super administrators.
 */
export async function getAuditLogs(params = {}) {
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (params.action) filter.action = params.action;
  if (params.targetResource) filter.targetResource = params.targetResource;
  if (params.targetId) filter.targetId = params.targetId;
  if (params.adminId) filter.adminId = params.adminId;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
