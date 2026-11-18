import readline from "node:readline";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import Admin, { ADMIN_ROLES_LIST } from "../models/Admin.js";
import { createAdmin, hashPassword } from "../services/adminService.js";

function parseArgs(argv) {
  const aliases = {
    u: "username",
    e: "email",
    p: "password",
    n: "name",
    r: "role",
    h: "help",
  };
  const flags = new Set(["help", "force", "inactive"]);
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("-")) continue;
    const raw = arg.replace(/^-+/, "");
    const [keyRaw, inlineVal] = raw.split("=");
    const key = aliases[keyRaw] || keyRaw;
    if (flags.has(key)) {
      out[key] = true;
      continue;
    }
    if (inlineVal !== undefined) {
      out[key] = inlineVal;
    } else {
      const next = argv[i + 1];
      if (next && !next.startsWith("-")) {
        out[key] = next;
        i += 1;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

function printHelp() {
  console.log(
    [
      "Create or update an admin account in MongoDB.",
      "",
      "Usage:",
      "  node scripts/createAdmin.js [options]",
      "",
      "Options:",
      "  -u, --username   admin username (3+ chars, lowercased)",
      "  -e, --email      admin email",
      "  -p, --password   admin password (8+ chars). Omit to be prompted.",
      "  -n, --name       display name (optional)",
      "  -r, --role       admin | super_admin",
      "      --inactive   create the account disabled",
      "      --force      update existing user instead of failing on duplicate",
      "  -h, --help       show this help",
      "",
      "Env: MONGO_URI must be set (read from .env).",
    ].join("\n")
  );
}

function prompt(question, { silent = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    if (silent) {
      // Swallow stdout writes that come from typed input so the password
      // never appears on screen; let the prompt itself and the trailing
      // newline pass through.
      const stdout = process.stdout;
      const origWrite = stdout.write.bind(stdout);
      stdout.write = (chunk, encoding, cb) => {
        if (typeof chunk === "string" && chunk.length > 0 && chunk !== question) {
          if (chunk === "\n" || chunk === "\r\n" || chunk === "\r") {
            return origWrite(chunk, encoding, cb);
          }
          return origWrite("", encoding, cb);
        }
        return origWrite(chunk, encoding, cb);
      };
      rl.question(question, (answer) => {
        stdout.write = origWrite;
        process.stdout.write("\n");
        rl.close();
        resolve(answer);
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateOrThrow({ username, email, password, role }) {
  const errors = [];
  if (!username || username.trim().length < 3) {
    errors.push("username must be at least 3 characters");
  }
  if (!email || !EMAIL_RE.test(email.trim())) {
    errors.push("email must be a valid address");
  }
  if (!password || String(password).length < 8) {
    errors.push("password must be at least 8 characters");
  }
  if (role && !ADMIN_ROLES_LIST.includes(role)) {
    errors.push(`role must be one of: ${ADMIN_ROLES_LIST.join(", ")}`);
  }
  if (errors.length) {
    throw new Error("Invalid input:\n  - " + errors.join("\n  - "));
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  // Collect inputs: CLI flag > env var > interactive prompt.
  const username =
    args.username ||
    process.env.ADMIN_USERNAME ||
    (await prompt("Username: ")).trim();

  const email =
    args.email ||
    process.env.ADMIN_EMAIL ||
    (await prompt("Email: ")).trim();

  const name =
    args.name !== undefined
      ? String(args.name)
      : process.env.ADMIN_NAME || "";

  let password = args.password || process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await prompt("Password (hidden): ", { silent: true });
    const confirm = await prompt("Confirm password: ", { silent: true });
    if (password !== confirm) {
      throw new Error("Passwords do not match");
    }
  }

  await connectDB();

  // Default role: very first admin becomes super_admin, everyone else is plain admin.
  const existingCount = await Admin.countDocuments();
  const role = args.role || (existingCount === 0 ? "super_admin" : "admin");
  const active = !args.inactive;

  validateOrThrow({ username, email, password, role });

  const normalizedUsername = username.toLowerCase().trim();
  const normalizedEmail = email.toLowerCase().trim();

  const duplicate = await Admin.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });

  if (duplicate && !args.force) {
    throw new Error(
      `An admin with that ${
        duplicate.username === normalizedUsername ? "username" : "email"
      } already exists. Re-run with --force to update it.`
    );
  }

  if (duplicate && args.force) {
    duplicate.username = normalizedUsername;
    duplicate.email = normalizedEmail;
    if (name) duplicate.name = name;
    duplicate.role = role;
    duplicate.active = active;
    duplicate.passwordHash = await hashPassword(password);
    await duplicate.save();
    console.log(
      `✓ Updated admin "${duplicate.username}" (role=${duplicate.role}, active=${duplicate.active}, id=${duplicate._id})`
    );
    return;
  }

  const created = await createAdmin({
    username: normalizedUsername,
    email: normalizedEmail,
    name,
    role,
    active,
    password,
  });
  console.log(
    `✓ Created admin "${created.username}" (role=${created.role}, active=${created.active}, id=${created._id})`
  );
}

main()
  .catch((err) => {
    console.error(`\n✗ ${err.message || err}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
  });
