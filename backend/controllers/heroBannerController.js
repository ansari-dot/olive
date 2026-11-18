import * as heroBannerService from "../services/heroBannerService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getHeroBanner = asyncHandler(async (_req, res) => {
  const doc = await heroBannerService.getHeroBanner();
  res.json(doc || null);
});

export const upsertHeroBanner = asyncHandler(async (req, res) => {
  const doc = await heroBannerService.upsertHeroBanner(req.body);
  res.json(doc);
});
