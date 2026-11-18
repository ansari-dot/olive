import { env } from "../config/env.js";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";

function colorStatus(status) {
  if (status >= 500) return `${RED}${status}${RESET}`;
  if (status >= 400) return `${YELLOW}${status}${RESET}`;
  return `${GREEN}${status}${RESET}`;
}

function colorTime(ms) {
  if (ms > 1000) return `${RED}${ms}ms${RESET}`;
  if (ms > 300) return `${YELLOW}${ms}ms${RESET}`;
  return `${GREEN}${ms}ms${RESET}`;
}

function pretty(entry) {
  const cache = entry.cache ? ` ${DIM}[${entry.cache}]${RESET}` : "";
  const method = `${CYAN}${entry.method.padEnd(7)}${RESET}`;
  const idSuffix = entry.id ? ` ${DIM}${entry.id.slice(0, 8)}${RESET}` : "";
  return `${method} ${entry.path} ${colorStatus(entry.status)} ${colorTime(
    entry.ms
  )}${cache}${idSuffix}`;
}

/**
 * Request access logger. Emits a single line per request in either:
 *  - `pretty` mode (default for dev): colorized human-readable output
 *  - `json` mode (default for prod): one JSON object per line, friendly to
 *    log aggregators (CloudWatch, Loki, Datadog, etc.)
 *
 * In both modes, slow requests (>1s) and error responses get a follow-up
 * line so they stand out in tail-style monitoring.
 */
export function logger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const ms = Date.now() - start;
    const entry = {
      id: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms,
      cache: res.getHeader("X-Cache") || undefined,
    };

    if (env.LOG_FORMAT === "json") {
      console.log(JSON.stringify({ level: "info", type: "request", ...entry }));
    } else {
      console.log(pretty(entry));
      if (entry.status >= 400) {
        console.error(
          `  ${RED}↳ ${entry.status} ${entry.method} ${entry.path}${RESET}`
        );
      }
      if (entry.ms > 1000) {
        console.warn(
          `  ${YELLOW}↳ slow ${entry.ms}ms on ${entry.method} ${entry.path}${RESET}`
        );
      }
    }
  });

  next();
}

export default logger;
