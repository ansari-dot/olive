import { Router } from "express";
import * as dashboardController from "../controllers/dashboardController.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.js";

const router = Router();

router.use(verifyAdmin);
router.get("/stats", dashboardController.getStats);
router.get("/", dashboardController.getStats);

export default router;
