import { Router } from "express";
import {
  getDealSection,
  upsertDealSection,
} from "../controllers/dealSectionController.js";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { dealSectionSchema } from "../validators/homeSectionsValidator.js";

const router = Router();

router.get("/", getDealSection);
router.put(
  "/",
  requireAdmin,
  validate({ body: dealSectionSchema }),
  upsertDealSection
);

export default router;
