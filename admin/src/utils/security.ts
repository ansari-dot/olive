/**
 * Zaitoon Pakistan Admin Security Utilities
 * Hardened client-side helpers to guard against XSS, open redirects, and CSV injection.
 */

/**
 * Escapes HTML characters to prevent XSS attacks when rendering dynamic strings.
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Validates URLs before rendering as links or redirecting, blocking javascript: and vbscript: protocols.
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("data:text/html")
  ) {
    return false;
  }
  return true;
}

/**
 * Sanitizes cell values for CSV export / rendering to prevent CSV Formula Injection (DDE).
 */
export function sanitizeCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return str.replace(/"/g, '""');
}

/**
 * Checks if a string is a valid MongoDB ObjectID representation (24 hex characters).
 */
export function isValidMongoId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}
