import { Router } from "express";
import {
  getAll,
  create,
  update,
  remove,
} from "../controllers/instagramController.js";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import {
  createInstagramSchema,
  updateInstagramSchema,
  instagramIdParamSchema,
} from "../validators/instagramValidator.js";

const router = Router();

router.get("/", getAll);

router.post("/", requireAdmin, validate({ body: createInstagramSchema }), create);
router.put(
  "/:id",
  requireAdmin,
  validate({ params: instagramIdParamSchema, body: updateInstagramSchema }),
  update
);
router.delete(
  "/:id",
  requireAdmin,
  validate({ params: instagramIdParamSchema }),
  remove
);

export default router;
