import { Router } from "express";
import * as blogController from "../controllers/blogController.js";

const router = Router();

// Public routes
router.get("/", blogController.getPublishedBlogs);
router.get("/:idOrSlug", blogController.getBlogByIdOrSlug);

export default router;
