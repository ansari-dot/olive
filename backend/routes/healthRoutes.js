import { Router } from "express";
import { liveness, readiness } from "../controllers/healthController.js";

const router = Router();

router.get("/", liveness);
router.get("/live", liveness);
router.get("/ready", readiness);

export default router;
