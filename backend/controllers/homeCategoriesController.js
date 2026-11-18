import * as homeCategoriesService from "../services/homeCategoriesService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getHomeCategories = asyncHandler(async (_req, res) => {
  const doc = await homeCategoriesService.getHomeCategories();
  res.json(doc || null);
});

export const upsertHomeCategories = asyncHandler(async (req, res) => {
  const doc = await homeCategoriesService.upsertHomeCategories(req.body);
  res.json(doc);
});
