import * as newsletterService from "../services/newsletterService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Public: POST /api/newsletter and POST /api/subscribers
export const subscribe = asyncHandler(async (req, res) => {
  const result = await newsletterService.subscribe(req.body);
  const statusCode = result.isNew ? 201 : 200;
  return ApiResponse.success(
    res,
    { subscriber: result.subscriber, data: result.subscriber },
    result.message,
    statusCode
  );
});

// Admin: GET /api/admin/newsletter
export const getAdminSubscribers = asyncHandler(async (_req, res) => {
  const subscribers = await newsletterService.getAdminSubscribers();
  return ApiResponse.success(res, { subscribers, data: subscribers });
});

// Admin: GET /api/admin/newsletter/export
export const exportSubscribersCSV = asyncHandler(async (_req, res) => {
  const csv = await newsletterService.exportSubscribersCSV();
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="zaitoon-newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`
  );
  return res.send(csv);
});
