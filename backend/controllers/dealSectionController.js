import * as dealSectionService from "../services/dealSectionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDealSection = asyncHandler(async (_req, res) => {
  const doc = await dealSectionService.getDealSectionWithStock();
  res.json(doc || null);
});

export const upsertDealSection = asyncHandler(async (req, res) => {
  const doc = await dealSectionService.upsertDealSection(req.body);
  res.json(doc);
});
