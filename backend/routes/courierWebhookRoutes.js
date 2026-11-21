import { Router } from "express";
import { handleCourierWebhook } from "../controllers/courierWebhookController.js";

const router = Router();

router.post("/:provider", handleCourierWebhook);
router.post("/", handleCourierWebhook);

export default router;
