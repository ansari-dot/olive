import { Router } from "express";
import {
  getCompareSection,
  upsertCompareSection,
} from "../controllers/compareSectionController.js";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { compareSectionSchema } from "../validators/homeSectionsValidator.js";

const router = Router();

router.get("/", getCompareSection);
router.put(
  "/",
  requireAdmin,
  validate({ body: compareSectionSchema }),
  upsertCompareSection
);

export default router;
