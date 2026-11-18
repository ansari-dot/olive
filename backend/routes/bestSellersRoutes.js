import { Router } from "express";
import {
  getBestSellers,
  upsertBestSellers,
} from "../controllers/bestSellersController.js";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { bestSellersSchema } from "../validators/homeSectionsValidator.js";

const router = Router();

router.get("/", getBestSellers);
router.put(
  "/",
  requireAdmin,
  validate({ body: bestSellersSchema }),
  upsertBestSellers
);

export default router;
