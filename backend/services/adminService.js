import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePagination } from "../utils/pagination.js";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain) {
  return bcrypt.hash(String(plain), BCRYPT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(String(plain), String(hash));
}

export async function countAdmins() {
  return Admin.countDocuments();
}

export async function listAdmins(query = {}) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const [admins, total] = await Promise.all([
    Admin.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Admin.countDocuments(),
  ]);
  return {
    admins: admins.map((a) => a.toJSON()),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAdminById(id) {
  const admin = await Admin.findById(id);
  if (!admin) throw ApiError.notFound("Admin not found");
  return admin.toJSON();
}

export async function createAdmin(body) {
  const { password, ...rest } = body;
  const passwordHash = await hashPassword(password);
  try {
    const admin = await Admin.create({ ...rest, passwordHash });
    return admin.toJSON();
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "value";
      throw ApiError.conflict(`Duplicate ${field}`);
    }
    throw err;
  }
}

export async function updateAdmin(id, body) {
  const payload = { ...body };
  if (payload.password) {
    payload.passwordHash = await hashPassword(payload.password);
    delete payload.password;
  }
  try {
    const admin = await Admin.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!admin) throw ApiError.notFound("Admin not found");
    return admin.toJSON();
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "value";
      throw ApiError.conflict(`Duplicate ${field}`);
    }
    throw err;
  }
}

export async function deleteAdmin(id, requesterId) {
  // Refuse to delete yourself — otherwise an operator could lock everyone out.
  if (String(requesterId) === String(id)) {
    throw ApiError.badRequest("You cannot delete your own account");
  }
  const remaining = await Admin.countDocuments({
    active: true,
    _id: { $ne: id },
  });
  if (remaining === 0) {
    throw ApiError.badRequest("Cannot delete the last active admin");
  }
  const deleted = await Admin.findByIdAndDelete(id);
  if (!deleted) throw ApiError.notFound("Admin not found");
  return { message: "Admin deleted" };
}

/** Internal lookup used during login — returns the raw document (with hash). */
export async function findAdminForLogin({ username, email }) {
  if (username) return Admin.findOne({ username });
  if (email) return Admin.findOne({ email });
  return null;
}

export async function touchLastLogin(adminId) {
  await Admin.updateOne({ _id: adminId }, { $set: { lastLoginAt: new Date() } });
}

// Brute-force defence tuning. Five wrong passwords in a row locks the account
// for 15 minutes — long enough to make online guessing infeasible, short
// enough that a legitimate user who fat-fingered their password can recover
// without admin intervention.
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

/** Returns true if the account is currently locked. */
export function isLocked(admin) {
  return Boolean(admin?.lockUntil && admin.lockUntil.getTime() > Date.now());
}

/**
 * Reset the lockout bookkeeping and stamp `lastLoginAt`. Called once a login
 * has been fully authenticated.
 */
export async function recordLoginSuccess(adminId) {
  await Admin.updateOne(
    { _id: adminId },
    {
      $set: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    }
  );
}

/**
 * Increment the per-account failure counter. When the threshold is reached,
 * stamp `lockUntil` so subsequent attempts are rejected without even checking
 * the password — defeating IP-rotating brute force.
 *
 * Returns `{ locked, remaining }` so the caller can decide what to surface
 * (we deliberately keep the auth response message generic to avoid telling
 * an attacker how close they are).
 */
export async function recordLoginFailure(adminId) {
  if (!adminId) return { locked: false, remaining: MAX_FAILED_ATTEMPTS };
  const updated = await Admin.findOneAndUpdate(
    { _id: adminId },
    { $inc: { failedLoginAttempts: 1 } },
    { new: true }
  );
  if (!updated) return { locked: false, remaining: MAX_FAILED_ATTEMPTS };
  if (updated.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    updated.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    updated.failedLoginAttempts = 0;
    await updated.save();
    return { locked: true, remaining: 0 };
  }
  return {
    locked: false,
    remaining: MAX_FAILED_ATTEMPTS - updated.failedLoginAttempts,
  };
}
