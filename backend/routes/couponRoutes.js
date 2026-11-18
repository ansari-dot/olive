import { Router } from "express";
import * as couponController from "../controllers/couponController.js";
import { publicWriteLimiter } from "../middlewares/rateLimit.js";

const router = Router();

// Public validation endpoints
router.post("/validate", publicWriteLimiter, couponController.validateCoupon);

export default router;
