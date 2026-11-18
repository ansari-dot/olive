import * as homeCollectionService from "../services/homeCollectionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getHomeCollection = asyncHandler(async (_req, res) => {
  const doc = await homeCollectionService.getHomeCollection();
  res.json(doc || null);
});

export const upsertHomeCollection = asyncHandler(async (req, res) => {
  const doc = await homeCollectionService.upsertHomeCollection(req.body);
  res.json(doc);
});
