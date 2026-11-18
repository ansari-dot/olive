import crypto from "crypto";

const HEADER = "x-request-id";

/**
 * Attach a per-request correlation id. Honors an inbound `X-Request-Id`
 * header if the upstream load balancer is already generating one, otherwise
 * creates a UUID. The id is stamped on the response so clients/logs can
 * cross-reference.
 */
export function requestId(req, res, next) {
  const incoming = String(req.headers[HEADER] || "").trim();
  const id = incoming || crypto.randomUUID();
  req.id = id;
  res.setHeader(HEADER, id);
  next();
}

export default requestId;
