import * as aboutTeamService from "../services/aboutTeamService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAboutTeam = asyncHandler(async (_req, res) => {
  const doc = await aboutTeamService.getAboutTeam();
  res.json(doc || null);
});

export const upsertAboutTeam = asyncHandler(async (req, res) => {
  const doc = await aboutTeamService.upsertAboutTeam(req.body);
  res.json(doc);
});
