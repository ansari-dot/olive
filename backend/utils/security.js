/**
 * Zaitoon Pakistan Backend Security Helpers
 * Functions for ReDoS prevention, CSV formula injection defense, and input sanitization.
 */

/**
 * Escapes special regex characters so user-provided search strings cannot
 * trigger ReDoS (catastrophic backtracking) or regex syntax crashes.
 */
export function escapeRegex(input) {
  if (typeof input !== "string") return "";
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sanitizes a cell value for CSV streaming/export to prevent Formula Injection (CSV DDE).
 * If the value starts with any spreadsheet calculation character (=, +, -, @, \t, \r),
 * it prepends a single quote (') and escapes embedded double quotes.
 */
export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Deeply sanitizes an object/array in-place against NoSQL injection:
 * strips any keys starting with "$" or containing forbidden prototype pollution keys.
 */
export function deepSanitize(target) {
  if (!target || typeof target !== "object") return target;

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      target[i] = deepSanitize(target[i]);
    }
    return target;
  }

  for (const key of Object.keys(target)) {
    if (
      key.startsWith("$") ||
      key === "__proto__" ||
      key === "constructor" ||
      key === "prototype"
    ) {
      delete target[key];
    } else if (typeof target[key] === "object" && target[key] !== null) {
      deepSanitize(target[key]);
    }
  }

  return target;
}
