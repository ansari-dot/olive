import { Router } from "express";
import * as blogController from "../controllers/blogController.js";

const router = Router();

// Public routes
router.get("/", blogController.getPublishedBlogs);
router.get("/:idOrSlug", blogController.getBlogByIdOrSlug);
router.get("/:idOrSlug/comments", blogController.getBlogComments);
router.post("/:idOrSlug/comments", blogController.addBlogComment);

export default router;
