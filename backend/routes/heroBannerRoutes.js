import { Router } from "express";
import {
  getHeroBanner,
  upsertHeroBanner,
} from "../controllers/heroBannerController.js";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { heroBannerSchema } from "../validators/homeSectionsValidator.js";

const router = Router();

router.get("/", getHeroBanner);
router.put("/", requireAdmin, validate({ body: heroBannerSchema }), upsertHeroBanner);

export default router;
