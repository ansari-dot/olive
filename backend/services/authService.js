import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import AdminUser from "../models/AdminUser.js";
import { ApiError } from "../utils/ApiError.js";

export async function loginAdmin({ email, username, password }) {
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

  const token = jwt.sign(
    {
      sub: String(admin._id),
      id: String(admin._id),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
    env.JWT.SECRET,
    { expiresIn: env.JWT.EXPIRES_IN || "7d" }
  );

  return {
    token,
    expiresInMs: env.JWT.EXPIRES_IN_MS || 7 * 24 * 60 * 60 * 1000,
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

export function verifySessionToken(token) {
  if (!token) throw ApiError.unauthorized("Authentication required");
  try {
    return jwt.verify(token, env.JWT.SECRET);
  } catch (err) {
    throw ApiError.unauthorized("Invalid or expired session");
  }
}
