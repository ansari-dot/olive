import { Router } from "express";
import {
  getAboutTeam,
  upsertAboutTeam,
} from "../controllers/aboutTeamController.js";
import { validate } from "../middlewares/validate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { aboutTeamSchema } from "../validators/homeSectionsValidator.js";

const router = Router();

router.get("/", getAboutTeam);
router.put("/", requireAdmin, validate({ body: aboutTeamSchema }), upsertAboutTeam);

export default router;
