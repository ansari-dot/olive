import * as homeService from "../services/homeService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getHomeData = asyncHandler(async (_req, res) => {
  const data = await homeService.getHomeData();
  res.json(data);
});
