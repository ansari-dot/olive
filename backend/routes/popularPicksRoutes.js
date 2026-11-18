import { Router } from "express";
import {
  getPopularPicks,
  upsertPopularPicks,
} from "../controllers/popularPicksController.js";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { popularPicksSchema } from "../validators/homeSectionsValidator.js";

const router = Router();

router.get("/", getPopularPicks);
router.put(
  "/",
  requireAdmin,
  validate({ body: popularPicksSchema }),
  upsertPopularPicks
);

export default router;
