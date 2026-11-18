import { Router } from "express";
import {
  getCategorySections,
  createCategorySection,
  updateCategorySection,
  deleteCategorySection,
} from "../controllers/categorySectionController.js";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import {
  createCategorySectionSchema,
  updateCategorySectionSchema,
  categorySectionIdParamSchema,
} from "../validators/homeSectionsValidator.js";

const router = Router();

router.get("/", getCategorySections);

router.post(
  "/",
  requireAdmin,
  validate({ body: createCategorySectionSchema }),
  createCategorySection
);
router.put(
  "/:id",
  requireAdmin,
  validate({
    params: categorySectionIdParamSchema,
    body: updateCategorySectionSchema,
  }),
  updateCategorySection
);
router.delete(
  "/:id",
  requireAdmin,
  validate({ params: categorySectionIdParamSchema }),
  deleteCategorySection
);

export default router;
