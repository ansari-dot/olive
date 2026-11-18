import { Router } from "express";
import { initPayfast, payfastNotify } from "../controllers/payfastController.js";
import { validate } from "../middlewares/validate.js";
import { publicWriteLimiter } from "../middlewares/rateLimit.js";
import { payfastInitSchema } from "../validators/payfastValidator.js";

const router = Router();

// Checkout init from the storefront — rate limited per-IP.
router.post(
  "/init",
  publicWriteLimiter,
  validate({ body: payfastInitSchema }),
  initPayfast
);

// IPN callback from PayFast — never rate limited (would risk dropping a real
// settlement). Signature verification happens inside the service.
router.post("/notify", payfastNotify);

export default router;
