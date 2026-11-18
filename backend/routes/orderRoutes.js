import { Router } from "express";
import * as orderController from "../controllers/orderController.js";
import { publicWriteLimiter } from "../middlewares/rateLimit.js";

const router = Router();

// Public guest routes
router.post("/", publicWriteLimiter, orderController.createOrder);
router.get("/track/:orderReference", orderController.trackOrder);

export default router;
