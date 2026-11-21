import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createDeal as createDealService,
  updateDeal as updateDealService,
  toggleDealActive as toggleDealActiveService,
  deleteDeal as deleteDealService,
  listAdminDeals as listAdminDealsService,
  getActiveDeals as getActiveDealsService,
} from "../services/dealService.js";

/**
 * Public: Get all currently active running deals with populated product details
 */
export const getActiveDeals = asyncHandler(async (_req, res) => {
  const deals = await getActiveDealsService();
  return ApiResponse.success(res, { deals, count: deals.length });
});

/**
 * Admin: List all deals with enriched status (active, scheduled, expired, disabled, sold_out)
 */
export const getAdminDeals = asyncHandler(async (req, res) => {
  const deals = await listAdminDealsService(req.query);
  return ApiResponse.success(res, { deals, count: deals.length });
});

/**
 * Admin: Create a new deal
 */
export const createDeal = asyncHandler(async (req, res) => {
  const deal = await createDealService(req.body);
  return ApiResponse.created(res, { deal }, "Deal created successfully");
});

/**
 * Admin: Update an existing deal
 */
export const updateDeal = asyncHandler(async (req, res) => {
  const deal = await updateDealService(req.params.id, req.body);
  return ApiResponse.success(res, { deal }, "Deal updated successfully");
});

/**
 * Admin: Toggle deal active/disabled
 */
export const toggleDeal = asyncHandler(async (req, res) => {
  const deal = await toggleDealActiveService(req.params.id, req.body.isActive);
  return ApiResponse.success(
    res,
    { deal },
    `Deal ${deal.isActive ? "activated" : "disabled"} successfully`
  );
});

/**
 * Admin: Delete a deal
 */
export const deleteDeal = asyncHandler(async (req, res) => {
  await deleteDealService(req.params.id);
  return ApiResponse.success(res, {}, "Deal deleted successfully");
});
