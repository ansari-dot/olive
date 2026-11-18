import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.js";
import { authLimiter } from "../middlewares/rateLimit.js";

const router = Router();

router.post("/login", authLimiter, authController.login);
router.post("/logout", authController.logout);
router.get("/me", verifyAdmin, authController.me);

export default router;
