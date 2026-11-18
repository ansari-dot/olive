import { Router } from "express";
import {
  getConsultations,
  createConsultation,
  updateConsultationStatus,
} from "../controllers/consultationController.js";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { publicWriteLimiter } from "../middlewares/rateLimit.js";
import {
  createConsultationSchema,
  consultationListQuerySchema,
  updateConsultationStatusSchema,
  consultationIdParamSchema,
} from "../validators/consultationValidator.js";

const router = Router();

router.get(
  "/",
  requireAdmin,
  validate({ query: consultationListQuerySchema }),
  getConsultations
);
router.post(
  "/",
  publicWriteLimiter,
  validate({ body: createConsultationSchema }),
  createConsultation
);
router.patch(
  "/:id/status",
  requireAdmin,
  validate({
    params: consultationIdParamSchema,
    body: updateConsultationStatusSchema,
  }),
  updateConsultationStatus
);

export default router;
