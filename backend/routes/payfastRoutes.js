import { Router } from "express";
import {
  initPayfast,
  payfastNotify,
  simulateSandboxPayment,
} from "../controllers/payfastController.js";
import { publicWriteLimiter } from "../middlewares/rateLimit.js";

const router = Router();

// Checkout init from the storefront
router.post("/init", publicWriteLimiter, initPayfast);

// IPN callback from PayFast
router.post("/notify", payfastNotify);

// Sandbox Simulation (Development helper)
router.post("/simulate-success/:orderReference", simulateSandboxPayment);

export default router;
