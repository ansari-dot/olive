import * as compareSectionService from "../services/compareSectionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getCompareSection = asyncHandler(async (_req, res) => {
  const doc = await compareSectionService.getCompareSection();
  res.json(doc || null);
});

export const upsertCompareSection = asyncHandler(async (req, res) => {
  const doc = await compareSectionService.upsertCompareSection(req.body);
  res.json(doc);
});
