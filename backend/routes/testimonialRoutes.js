import { Router } from "express";
import {
  getTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/testimonialController.js";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import {
  createTestimonialSchema,
  updateTestimonialSchema,
  testimonialListQuerySchema,
  testimonialIdParamSchema,
} from "../validators/testimonialValidator.js";

const router = Router();

router.get(
  "/",
  validate({ query: testimonialListQuerySchema }),
  getTestimonials
);
router.get(
  "/:id",
  validate({ params: testimonialIdParamSchema }),
  getTestimonialById
);

router.post(
  "/",
  requireAdmin,
  validate({ body: createTestimonialSchema }),
  createTestimonial
);
router.put(
  "/:id",
  requireAdmin,
  validate({ params: testimonialIdParamSchema, body: updateTestimonialSchema }),
  updateTestimonial
);
router.delete(
  "/:id",
  requireAdmin,
  validate({ params: testimonialIdParamSchema }),
  deleteTestimonial
);

export default router;
