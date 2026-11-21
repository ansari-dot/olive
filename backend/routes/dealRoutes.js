import { Router } from "express";
import * as dealController from "../controllers/dealController.js";

const router = Router();

// Public storefront deals endpoint
router.get("/", dealController.getActiveDeals);

export default router;
