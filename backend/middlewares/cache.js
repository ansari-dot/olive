import { env } from "../config/env.js";

const store = new Map();
const MAX_CACHE_SIZE = 500;

/**
 * Build a cache key that is insensitive to query-parameter order so
 * `/foo?a=1&b=2` and `/foo?b=2&a=1` collide on the same entry.
 */
function buildCacheKey(req) {
  const [path, qs = ""] = req.originalUrl.split("?");
  if (!qs) return path;
  const params = new URLSearchParams(qs);
  const pairs = [];
  for (const [k, v] of params) pairs.push([k, v]);
  pairs.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const normalized = pairs.map(([k, v]) => `${k}=${v}`).join("&");
  return normalized ? `${path}?${normalized}` : path;
}

/**
 * Simple in-memory cache middleware. GET requests are cached for `ttlSeconds`
 * keyed by a normalized URL. Bypasses cache entirely if the request includes
 * an `Authorization` header (so per-admin responses don't leak across users).
 */
export function cache(ttlSeconds = 30) {
  return (req, res, next) => {
    if (req.method !== "GET") return next();
    // Bypass cache for any authenticated request so admin browsers never read
    // (or accidentally populate) the public response cache.
    if (
      req.headers.authorization ||
      req.headers["x-admin-token"] ||
      req.cookies?.[env.COOKIE.NAME]
    ) {
      return next();
    }

    const key = buildCacheKey(req);
    const hit = store.get(key);

    if (hit && Date.now() < hit.expiresAt) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
      return res.send(hit.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Don't cache error responses.
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (store.size >= MAX_CACHE_SIZE) {
          const firstKey = store.keys().next().value;
          store.delete(firstKey);
        }
        store.set(key, {
          body: JSON.stringify(data),
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
      }
      res.setHeader("X-Cache", "MISS");
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
      return originalJson(data);
    };

    next();
  };
}

/** Invalidate all cached entries whose key starts with `prefix`. */
export function invalidateCache(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Clear the entire cache (used by tests). */
export function clearCache() {
  store.clear();
}
