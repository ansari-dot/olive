import { Router } from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryListQuerySchema,
  categoryIdParamSchema,
} from "../validators/categoryValidator.js";

const router = Router();

router.get("/", validate({ query: categoryListQuerySchema }), getCategories);
router.get(
  "/:id",
  validate({ params: categoryIdParamSchema }),
  getCategoryById
);

router.post(
  "/",
  requireAdmin,
  validate({ body: createCategorySchema }),
  createCategory
);
router.put(
  "/:id",
  requireAdmin,
  validate({ params: categoryIdParamSchema, body: updateCategorySchema }),
  updateCategory
);
router.delete(
  "/:id",
  requireAdmin,
  validate({ params: categoryIdParamSchema }),
  deleteCategory
);

export default router;
