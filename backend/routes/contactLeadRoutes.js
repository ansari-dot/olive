import { Router } from "express";
import * as contactInquiryController from "../controllers/contactInquiryController.js";
import { publicWriteLimiter } from "../middlewares/rateLimit.js";

const router = Router();

// Public submission
router.post("/", publicWriteLimiter, contactInquiryController.submitInquiry);

export default router;
