import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import AdminUser from "../models/AdminUser.js";
import Session from "../models/Session.js";
import { ApiError } from "../utils/ApiError.js";

// Session lifetimes
const SESSION_TTL_MS = env.JWT.EXPIRES_IN_MS || 7 * 24 * 60 * 60 * 1000; // 7 days absolute
const IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours idle timeout

/**
 * Produces a SHA-256 hash of an opaque session token.
 * Raw tokens are never stored in the database.
 */
export function hashSessionToken(token) {
  if (!token || typeof token !== "string") return "";
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Authenticates an administrator and creates a stateful, revocable database session.
 */
export async function loginAdmin({ email, username, password }, meta = {}) {
  const query = {};
  if (email) {
    query.email = email.trim().toLowerCase();
  } else if (username) {
    query.$or = [
      { email: username.trim().toLowerCase() },
      { name: username.trim() },
    ];
  } else {
    throw ApiError.badRequest("Email and password are required");
  }

  if (!password) {
    throw ApiError.badRequest("Password is required");
  }

  const admin = await AdminUser.findOne(query);
  if (!admin) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  if (!admin.isActive) {
    throw ApiError.forbidden("Admin account is disabled");
  }

  // 1. Generate 256 bits of cryptographically secure random session token
  const rawSessionToken = crypto.randomBytes(32).toString("hex");
  const sessionHash = hashSessionToken(rawSessionToken);

  // 2. Persist hashed session in MongoDB
  const session = await Session.create({
    sessionHash,
    adminId: admin._id,
    role: admin.role,
    ipAddress: meta.ipAddress || "",
    userAgent: meta.userAgent || "",
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });

  return {
    sessionToken: rawSessionToken,
    token: rawSessionToken, // Compatibility fallback
    expiresInMs: SESSION_TTL_MS,
    session,
    admin: {
      _id: admin._id,
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    },
  };
}

/**
 * Validates a session token (either stateful Session hash or legacy JWT fallback).
 * Enforces absolute expiry, idle timeout, and active account status.
 */
export async function verifySessionToken(token, meta = {}) {
  if (!token) throw ApiError.unauthorized("Authentication required");

  const cleanToken = String(token).trim();
  const sessionHash = hashSessionToken(cleanToken);

  // 1. Primary path: Lookup opaque stateful session in MongoDB
  const session = await Session.findOne({
    sessionHash,
    isRevoked: false,
  }).populate("adminId");

  if (session) {
    // A. Enforce absolute expiration
    if (new Date() > new Date(session.expiresAt)) {
      session.isRevoked = true;
      session.revokedReason = "Session expired";
      await session.save();
      throw ApiError.unauthorized("Session expired");
    }

    // B. Enforce idle timeout
    const idleLimit = Date.now() - IDLE_TIMEOUT_MS;
    if (new Date(session.lastActiveAt).getTime() < idleLimit) {
      session.isRevoked = true;
      session.revokedReason = "Session timed out due to inactivity";
      await session.save();
      throw ApiError.unauthorized("Session timed out due to inactivity");
    }

    // C. Verify admin user account is active
    const admin = session.adminId;
    if (!admin || !admin.isActive) {
      session.isRevoked = true;
      session.revokedReason = "Admin account inactive or deleted";
      await session.save();
      throw ApiError.forbidden("Admin account is disabled");
    }

    // D. Throttled update of lastActiveAt (at most once every 5 minutes to prevent write amplification)
    if (Date.now() - new Date(session.lastActiveAt).getTime() > 5 * 60 * 1000) {
      session.lastActiveAt = new Date();
      if (meta.ipAddress) session.ipAddress = meta.ipAddress;
      await session.save();
    }

    return {
      admin,
      session,
      auth: {
        sub: String(admin._id),
        id: String(admin._id),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        sessionId: String(session._id),
      },
    };
  }

  // 2. Secondary fallback: Check for legacy JWT tokens during rolling updates
  try {
    const decoded = jwt.verify(cleanToken, env.JWT.SECRET);
    const adminId = decoded.sub || decoded.id || decoded._id;
    const admin = await AdminUser.findById(adminId).select("-password");
    if (!admin || !admin.isActive) {
      throw ApiError.unauthorized("Admin account inactive or not found");
    }

    return {
      admin,
      session: null,
      auth: {
        sub: String(admin._id),
        id: String(admin._id),
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  } catch (err) {
    throw ApiError.unauthorized("Invalid or expired session");
  }
}

/**
 * Revokes an active session immediately on logout.
 */
export async function revokeSession(token, reason = "User logged out") {
  if (!token) return false;
  const sessionHash = hashSessionToken(String(token).trim());
  const res = await Session.updateOne(
    { sessionHash, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    }
  );
  return res.modifiedCount > 0;
}

/**
 * Revokes all sessions for an admin account (on password change or deactivation).
 */
export async function revokeAllAdminSessions(adminId, reason = "Security revocation") {
  return await Session.updateMany(
    { adminId, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    }
  );
}
