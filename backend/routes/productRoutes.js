import { Router } from "express";
import * as productController from "../controllers/productController.js";
import { publicWriteLimiter } from "../middlewares/rateLimit.js";

const router = Router();

// Public routes
router.get("/navigation", productController.getProductNavigation);
router.get("/filters", productController.getProductFilters);
router.get("/", productController.getProducts);
router.get("/:idOrSlug", productController.getProductByIdOrSlug);
router.post("/:idOrSlug/reviews", publicWriteLimiter, productController.addReview);

export default router;
