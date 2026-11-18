import { Router } from "express";
import {
  getHomeCollection,
  upsertHomeCollection,
} from "../controllers/homeCollectionController.js";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { homeCollectionSchema } from "../validators/homeSectionsValidator.js";

const router = Router();

router.get("/", getHomeCollection);
router.put(
  "/",
  requireAdmin,
  validate({ body: homeCollectionSchema }),
  upsertHomeCollection
);

export default router;
