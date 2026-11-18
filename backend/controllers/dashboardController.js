import * as dashboardService from "../services/dashboardService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/admin/dashboard/stats & /api/dashboard/stats
export const getStats = asyncHandler(async (_req, res) => {
  const stats = await dashboardService.getDashboardStats();
  res.json({
    success: true,
    data: stats,
    ...stats,
  });
});
