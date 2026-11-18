import * as popularPicksService from "../services/popularPicksService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getPopularPicks = asyncHandler(async (_req, res) => {
  const doc = await popularPicksService.getPopularPicks();
  res.json(doc || null);
});

export const upsertPopularPicks = asyncHandler(async (req, res) => {
  const doc = await popularPicksService.upsertPopularPicks(req.body);
  res.json(doc);
});
