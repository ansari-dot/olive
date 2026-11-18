import * as bestSellersService from "../services/bestSellersService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getBestSellers = asyncHandler(async (_req, res) => {
  const doc = await bestSellersService.getBestSellers();
  res.json(doc || null);
});

export const upsertBestSellers = asyncHandler(async (req, res) => {
  const doc = await bestSellersService.upsertBestSellers(req.body);
  res.json(doc);
});
