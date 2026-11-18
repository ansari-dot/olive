import * as payfastService from "../services/payfastService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const initPayfast = asyncHandler(async (req, res) => {
  const debug = req.query?.debug === "1";
  const result = await payfastService.initPayfastCheckout(req.body, { debug });
  res.json(result);
});

/**
 * PayFast IPN/notify endpoint — must always return a plain text response.
 * Errors are sent as a 200-like style with text body for sandbox tolerance,
 * but using the proper HTTP code so we can debug in admin tooling.
 */
export const payfastNotify = asyncHandler(async (req, res) => {
  try {
    const meta = { host: req.hostname, ip: req.ip };
    const message = await payfastService.handlePayfastNotify(req.body, meta);
    res.type("text").send(message);
  } catch (err) {
    const status = err?.statusCode || 500;
    res.status(status).type("text").send(err?.message || "ERROR");
  }
});
