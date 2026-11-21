import * as contactInquiryService from "../services/contactInquiryService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Public: POST /api/contact and POST /api/contacts
export const submitInquiry = asyncHandler(async (req, res) => {
  const inquiry = await contactInquiryService.submitInquiry(req.body);
  return ApiResponse.created(
    res,
    { inquiry, data: inquiry },
    "Thank you for reaching out to Zaitoon Pakistan. Our orchard team will respond shortly."
  );
});

// Admin: GET /api/admin/inquiries
export const getAdminInquiries = asyncHandler(async (req, res) => {
  const inquiries = await contactInquiryService.getAdminInquiries(req.query);
  return ApiResponse.success(res, { inquiries, data: inquiries });
});

// Admin: PATCH /api/admin/inquiries/:id
export const updateInquiry = asyncHandler(async (req, res) => {
  const inquiry = await contactInquiryService.updateInquiry(req.params.id, req.body);
  return ApiResponse.success(res, { inquiry, data: inquiry });
});
