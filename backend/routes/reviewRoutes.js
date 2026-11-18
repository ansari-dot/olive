import { Router } from "express";
import {
  addReview,
  getProductReviews,
  canReviewProduct,
  markHelpful,
} from "../controllers/reviewController.js";
import { validate } from "../middlewares/validate.js";
import { publicWriteLimiter } from "../middlewares/rateLimit.js";
import {
  addReviewSchema,
  productIdParamSchema,
  reviewIdParamSchema,
  canReviewQuerySchema,
  productReviewsQuerySchema,
} from "../validators/reviewValidator.js";

const router = Router();

// Customer-facing — rate limited.
router.post("/", publicWriteLimiter, validate({ body: addReviewSchema }), addReview);
router.put(
  "/:reviewId/helpful",
  publicWriteLimiter,
  validate({ params: reviewIdParamSchema }),
  markHelpful
);

router.get(
  "/product/:productId",
  validate({
    params: productIdParamSchema,
    query: productReviewsQuerySchema,
  }),
  getProductReviews
);

router.get(
  "/can-review",
  validate({ query: canReviewQuerySchema }),
  canReviewProduct
);

export default router;
