import * as couponService from "../services/couponService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Public: POST /api/coupons/validate and alias POST /api/promo/validate
export const validateCoupon = asyncHandler(async (req, res) => {
  const result = await couponService.validateCoupon(req.body);
  res.json(result);
});

// Admin: GET /api/admin/coupons
export const getAdminCoupons = asyncHandler(async (_req, res) => {
  const coupons = await couponService.listCoupons();
  res.json({ success: true, coupons, data: coupons });
});

// Admin: POST /api/admin/coupons
export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);
  res.status(201).json({ success: true, coupon, data: coupon });
});

// Admin: PUT /api/admin/coupons/:id
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  res.json({ success: true, coupon, data: coupon });
});

// Admin: PATCH /api/admin/coupons/:id/toggle
export const toggleCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.toggleCoupon(req.params.id);
  res.json({ success: true, coupon, data: coupon });
});

// Admin: DELETE /api/admin/coupons/:id
export const deleteCoupon = asyncHandler(async (req, res) => {
  const result = await couponService.deleteCoupon(req.params.id);
  res.json(result);
});
