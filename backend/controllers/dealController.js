import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  createDeal as createDealService,
  updateDeal as updateDealService,
  toggleDealActive as toggleDealActiveService,
  deleteDeal as deleteDealService,
  listAdminDeals as listAdminDealsService,
  getActiveDealsMap,
} from "../services/dealService.js";
import Deal from "../models/Deal.js";

/**
 * Public: Get all currently active running deals with populated product details
 */
export const getActiveDeals = asyncHandler(async (req, res) => {
  const now = new Date();
  const deals = await Deal.find({
    isActive: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
    $expr: {
      $or: [
        { $eq: ["$dealStockLimit", 0] },
        { $lt: ["$dealSoldCount", "$dealStockLimit"] },
      ],
    },
  })
    .populate("product", "name price image slug category stock soldCount size")
    .sort({ endsAt: 1 })
    .lean();

  res.json({
    success: true,
    count: deals.length,
    deals,
  });
});

/**
 * Admin: List all deals with enriched status (active, scheduled, expired, disabled, sold_out)
 */
export const getAdminDeals = asyncHandler(async (req, res) => {
  const deals = await listAdminDealsService(req.query);
  res.json({
    success: true,
    count: deals.length,
    deals,
  });
});

/**
 * Admin: Create a new deal
 */
export const createDeal = asyncHandler(async (req, res) => {
  const deal = await createDealService(req.body);
  res.status(201).json({
    success: true,
    message: "Deal created successfully",
    deal,
  });
});

/**
 * Admin: Update an existing deal
 */
export const updateDeal = asyncHandler(async (req, res) => {
  const deal = await updateDealService(req.params.id, req.body);
  res.json({
    success: true,
    message: "Deal updated successfully",
    deal,
  });
});

/**
 * Admin: Toggle deal active state
 */
export const toggleDeal = asyncHandler(async (req, res) => {
  const deal = await toggleDealActiveService(req.params.id, req.body.isActive);
  res.json({
    success: true,
    message: `Deal ${deal.isActive ? "activated" : "disabled"} successfully`,
    deal,
  });
});

/**
 * Admin: Delete a deal
 */
export const deleteDeal = asyncHandler(async (req, res) => {
  const result = await deleteDealService(req.params.id);
  res.json(result);
});
