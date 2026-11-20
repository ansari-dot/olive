import { Router } from "express";
import {
  getOrigins,
  getOriginById,
  createOrigin,
  updateOrigin,
  deleteOrigin,
} from "../controllers/originController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = Router();

router.get("/", getOrigins);
router.get("/:id", getOriginById);

router.post("/", requireAdmin, createOrigin);
router.put("/:id", requireAdmin, updateOrigin);
router.delete("/:id", requireAdmin, deleteOrigin);

export default router;
