import { Router } from "express";
import * as newsletterController from "../controllers/newsletterController.js";
import { publicWriteLimiter } from "../middlewares/rateLimit.js";

const router = Router();

// Public subscription
router.post("/", publicWriteLimiter, newsletterController.subscribe);

export default router;
