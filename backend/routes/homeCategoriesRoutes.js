import { Router } from "express";
import {
  getHomeCategories,
  upsertHomeCategories,
} from "../controllers/homeCategoriesController.js";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { homeCategoriesSchema } from "../validators/homeSectionsValidator.js";

const router = Router();

router.get("/", getHomeCategories);
router.put(
  "/",
  requireAdmin,
  validate({ body: homeCategoriesSchema }),
  upsertHomeCategories
);

export default router;
