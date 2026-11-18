import { Router } from "express";
import { getReports } from "../controllers/reportController.js";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { reportsQuerySchema } from "../validators/reportValidator.js";

const router = Router();

router.use(requireAdmin);
router.get("/", validate({ query: reportsQuerySchema }), getReports);

export default router;
