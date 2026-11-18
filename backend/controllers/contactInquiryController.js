import ContactInquiry from "../models/ContactInquiry.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

// Public: POST /api/contact and POST /api/contacts
export const submitInquiry = asyncHandler(async (req, res) => {
  const { name, contactInfo, city, topic, message } = req.body;

  if (!name || !message || !topic) {
    throw ApiError.badRequest("Name, topic, and message are required");
  }

  const validTopics = [
    "Order & Cash on Delivery",
    "Product Harvest & Lab Purity",
    "Bulk & Corporate Gifting",
    "Orchard & Wholesale Partnership",
  ];

  if (!validTopics.includes(topic)) {
    throw ApiError.badRequest(`Invalid topic. Must be one of: ${validTopics.join(", ")}`);
  }

  const inquiry = await ContactInquiry.create({
    name: name.trim(),
    contactInfo: (contactInfo || req.body.email || req.body.phone || "").trim(),
    city: city ? city.trim() : "Islamabad",
    topic,
    message: message.trim(),
    status: "new",
  });

  res.status(201).json({
    success: true,
    message: "Thank you for reaching out to Zaitoon Pakistan. Our orchard team will respond shortly.",
    inquiry,
    data: inquiry,
  });
});

// Admin: GET /api/admin/inquiries
export const getAdminInquiries = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  const inquiries = await ContactInquiry.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, inquiries, data: inquiries });
});

// Admin: PATCH /api/admin/inquiries/:id
export const updateInquiry = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  const update = {};
  if (status) update.status = status;
  if (adminNote !== undefined) update.adminNote = adminNote;

  const inquiry = await ContactInquiry.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!inquiry) throw ApiError.notFound("Inquiry not found");

  res.json({ success: true, inquiry, data: inquiry });
});
