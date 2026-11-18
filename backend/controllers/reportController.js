import * as reportService from "../services/reportService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getReports = asyncHandler(async (req, res) => {
  const data = await reportService.getSalesReport(req.query);
  res.json(data);
});
