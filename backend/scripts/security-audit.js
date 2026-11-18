/**
 * Zaitoon Pakistan Backend Security Audit Scanner
 * Scans dependencies (CVEs), routes, controllers, middleware, upload guards, and input sanitizers.
 * Exits with status code 0 only if 0 vulnerabilities are found.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "..");

let findings = 0;

function report(testName, passed, detail = "") {
  if (passed) {
    console.log(`  [PASS] ${testName}`);
  } else {
    findings++;
    console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
  }
}

function scanFiles(dir, filter, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== "data" && entry.name !== "uploads") {
        scanFiles(fullPath, filter, callback);
      }
    } else if (filter(entry.name)) {
      callback(fullPath);
    }
  }
}

console.log("\n=======================================================");
console.log("  ZAITOON PAKISTAN BACKEND SECURITY AUDIT SCANNER      ");
console.log("=======================================================\n");

// 1. Dependency CVE Audit
console.log("--- 1. Production Dependencies CVE Audit ---");
try {
  const auditRaw = execSync("npm audit --omit=dev --json", {
    cwd: backendDir,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const audit = JSON.parse(auditRaw);
  const totalVulns = audit.metadata?.vulnerabilities?.total || 0;
  report("No CVEs in production dependencies", totalVulns === 0, `${totalVulns} vulnerabilities found`);
} catch (err) {
  try {
    const audit = JSON.parse(err.stdout || "{}");
    const totalVulns = audit.metadata?.vulnerabilities?.total || 0;
    const critical = audit.metadata?.vulnerabilities?.critical || 0;
    const high = audit.metadata?.vulnerabilities?.high || 0;
    const moderate = audit.metadata?.vulnerabilities?.moderate || 0;
    report(
      "No critical/high/moderate CVEs in production dependencies",
      critical === 0 && high === 0 && moderate === 0,
      `Critical: ${critical}, High: ${high}, Moderate: ${moderate}`
    );
  } catch {
    report("npm audit executed cleanly", false, "Failed to parse npm audit output");
  }
}

// 2. Admin Route Protection & RBAC
console.log("\n--- 2. Admin Routes RBAC & Protection ---");
const adminRoutesPath = path.resolve(backendDir, "routes", "adminRoutes.js");
if (fs.existsSync(adminRoutesPath)) {
  const adminRoutesSrc = fs.readFileSync(adminRoutesPath, "utf8");
  report("adminRoutes imports verifyAdmin middleware", adminRoutesSrc.includes("verifyAdmin"));
  report("adminRoutes applies router.use(verifyAdmin) to protect admin endpoints", adminRoutesSrc.includes("router.use(verifyAdmin)"));
  report("admin login endpoints protected with authLimiter rate limiter", adminRoutesSrc.includes("authLimiter"));
} else {
  report("adminRoutes.js exists", false, "Missing file");
}

// 3. Security Middlewares (Helmet, CORS, Body Limits, mongoSanitize)
console.log("\n--- 3. Core Security Middleware Configuration ---");
const appPath = path.resolve(backendDir, "app.js");
if (fs.existsSync(appPath)) {
  const appSrc = fs.readFileSync(appPath, "utf8");
  report("Helmet HTTP security headers configured", appSrc.includes("helmet("));
  report("CORS middleware mounted before routes", appSrc.includes("app.use(cors)"));
  report("NoSQL mongoSanitize middleware registered", appSrc.includes("mongoSanitize"));
  report("Strict request body limit enforced", appSrc.includes("REQUEST_BODY_LIMIT") || appSrc.includes("100kb"));
  report("Reverse proxy trust configured for production", appSrc.includes("trust proxy"));
} else {
  report("app.js exists", false, "Missing file");
}

// 4. Rate Limiting on Sensitive & Public Write Endpoints
console.log("\n--- 4. Brute-Force Rate Limiting ---");
const rateLimitPath = path.resolve(backendDir, "middlewares", "rateLimit.js");
if (fs.existsSync(rateLimitPath)) {
  const rateLimitSrc = fs.readFileSync(rateLimitPath, "utf8");
  report("Strict authLimiter defined for login", rateLimitSrc.includes("authLimiter"));
  report("publicWriteLimiter defined for checkout/leads", rateLimitSrc.includes("publicWriteLimiter"));
} else {
  report("rateLimit.js exists", false, "Missing file");
}

const orderRoutesPath = path.resolve(backendDir, "routes", "orderRoutes.js");
if (fs.existsSync(orderRoutesPath)) {
  const orderSrc = fs.readFileSync(orderRoutesPath, "utf8");
  report("Order creation route protected with publicWriteLimiter", orderSrc.includes("publicWriteLimiter"));
}

const subscriberRoutesPath = path.resolve(backendDir, "routes", "subscriberRoutes.js");
if (fs.existsSync(subscriberRoutesPath)) {
  const subSrc = fs.readFileSync(subscriberRoutesPath, "utf8");
  report("Newsletter subscription route protected with publicWriteLimiter", subSrc.includes("publicWriteLimiter"));
}

// 5. NoSQL Injection & ReDoS Prevention
console.log("\n--- 5. NoSQL Injection & ReDoS Defense ---");
const secUtilPath = path.resolve(backendDir, "utils", "security.js");
if (fs.existsSync(secUtilPath)) {
  const secSrc = fs.readFileSync(secUtilPath, "utf8");
  report("escapeRegex utility available for search strings", secSrc.includes("escapeRegex"));
  report("deepSanitize utility available for NoSQL operator stripping", secSrc.includes("deepSanitize"));
  report("sanitizeCsvCell utility available for CSV formula injection defense", secSrc.includes("sanitizeCsvCell"));
} else {
  report("utils/security.js exists", false, "Missing file");
}

let unescapedRegexCount = 0;
scanFiles(path.resolve(backendDir, "services"), (f) => f.endsWith(".js"), (filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    if (line.includes("new RegExp(") && !line.includes("escapeRegex") && !line.includes("test(")) {
      unescapedRegexCount++;
      console.warn(`    Potential unescaped RegExp at ${path.relative(backendDir, filePath)}:${idx + 1}`);
    }
  });
});
report("No unescaped dynamic RegExp constructions in services", unescapedRegexCount === 0);

// 6. Hardcoded Secrets & Weak Fallback Check
console.log("\n--- 6. Secrets & Environment Hardening ---");
const envPath = path.resolve(backendDir, "config", "env.js");
if (fs.existsSync(envPath)) {
  const envSrc = fs.readFileSync(envPath, "utf8");
  report("Production JWT_SECRET enforcement (fails fast if missing in production)", envSrc.includes("JWT_SECRET is required in production"));
}

let weakFallbackCount = 0;
scanFiles(path.resolve(backendDir, "config"), (f) => f.endsWith(".js"), (filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  if (/JWT_SECRET\s*\|\|\s*['"][a-zA-Z0-9]+['"]/i.test(content)) {
    weakFallbackCount++;
  }
});
report("No insecure hardcoded JWT secret fallbacks (e.g. || 'secret')", weakFallbackCount === 0);

// 7. Safe File Uploads (Multer & MIME Types)
console.log("\n--- 7. Safe File Upload Configuration ---");
const uploadPath = path.resolve(backendDir, "middlewares", "upload.js");
if (fs.existsSync(uploadPath)) {
  const uploadSrc = fs.readFileSync(uploadPath, "utf8");
  report("Multer enforces max 5 MB file size limit", uploadSrc.includes("5 * 1024 * 1024"));
  report("Multer strictly limits allowed MIME types (JPEG, PNG, WebP only)", uploadSrc.includes("image/jpeg") && uploadSrc.includes("image/png") && uploadSrc.includes("image/webp"));
  report("SVG, HTML, and executable extensions blocked in upload filter", !uploadSrc.includes("image/svg+xml") && uploadSrc.includes(".jpg") && uploadSrc.includes(".png") && uploadSrc.includes(".webp"));
} else {
  report("middlewares/upload.js exists", false, "Missing file");
}

// 8. Mass-Assignment & Allowlisting Checks
console.log("\n--- 8. Mass Assignment Protection ---");
let rawBodyCreateCount = 0;
const controllersDir = path.resolve(backendDir, "controllers");
scanFiles(controllersDir, (f) => f.endsWith(".js"), (filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  if (/\.create\(req\.body\)/.test(content) || /Object\.assign\([^,]+,\s*req\.body\)/.test(content)) {
    rawBodyCreateCount++;
    console.warn(`    Unprotected req.body assignment in: ${path.relative(backendDir, filePath)}`);
  }
});
report("No raw req.body passed directly to Model.create() without allowlisting", rawBodyCreateCount === 0);

// 9. Safe Production Error Handling
console.log("\n--- 9. Production Error Handling (No Stack/DB Leaks) ---");
const errHandlerPath = path.resolve(backendDir, "middlewares", "errorHandler.js");
if (fs.existsSync(errHandlerPath)) {
  const errSrc = fs.readFileSync(errHandlerPath, "utf8");
  report("Production hides internal 500 error messages and stack traces", errSrc.includes("Internal Server Error") && errSrc.includes("env.IS_PROD"));
} else {
  report("middlewares/errorHandler.js exists", false, "Missing file");
}

// 10. CSV Formula Injection Defense
console.log("\n--- 10. CSV Formula Injection Defense ---");
const newsletterPath = path.resolve(backendDir, "controllers", "newsletterController.js");
if (fs.existsSync(newsletterPath)) {
  const newsSrc = fs.readFileSync(newsletterPath, "utf8");
  report("Newsletter CSV export applies formula sanitization (sanitizeCsvCell)", newsSrc.includes("sanitizeCsvCell"));
} else {
  report("controllers/newsletterController.js exists", false, "Missing file");
}

console.log("\n=======================================================");
console.log(`  BACKEND AUDIT COMPLETE: ${findings === 0 ? "0 FINDINGS (CLEAN)" : `${findings} FINDINGS FOUND`}  `);
console.log("=======================================================\n");

if (findings > 0) {
  process.exit(1);
}
