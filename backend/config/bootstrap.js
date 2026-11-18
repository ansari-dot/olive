import bcrypt from "bcryptjs";
import AdminUser from "../models/AdminUser.js";
import { env } from "./env.js";

/**
 * Idempotent bootstrap: if no admin exists yet, create the first super_admin
 * from ADMIN_EMAIL / ADMIN_PASSWORD in env or sensible Zaitoon Pakistan dev defaults.
 */
export async function bootstrapFirstAdmin() {
  const count = await AdminUser.countDocuments();
  if (count > 0) return false;

  const email = env.ADMIN_BOOTSTRAP.EMAIL || "admin@zaitoonpakistan.pk";
  const password = env.ADMIN_BOOTSTRAP.PASSWORD || "ZaitoonAdmin2026!";
  const name = env.ADMIN_BOOTSTRAP.NAME || "Zaitoon Super Admin";

  const hashedPassword = await bcrypt.hash(password, 12);
  await AdminUser.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: "super_admin",
    isActive: true,
  });

  console.log(`[bootstrap] Seeded initial super_admin "${email}"`);
  return true;
}

export default bootstrapFirstAdmin;
