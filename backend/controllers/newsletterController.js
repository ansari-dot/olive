import NewsletterSubscriber from "../models/NewsletterSubscriber.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { sanitizeCsvCell } from "../utils/security.js";

// Public: POST /api/newsletter and POST /api/subscribers
export const subscribe = asyncHandler(async (req, res) => {
  const { email, source } = req.body;
  if (!email || !email.includes("@")) {
    throw ApiError.badRequest("A valid email address is required");
  }

  const cleanEmail = email.trim().toLowerCase();

  const existing = await NewsletterSubscriber.findOne({ email: cleanEmail });
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      await existing.save();
    }
    return res.json({
      success: true,
      message: "You are subscribed to Zaitoon Pakistan's Harvest Letter",
      subscriber: existing,
      data: existing,
    });
  }

  const subscriber = await NewsletterSubscriber.create({
    email: cleanEmail,
    source: source || "Harvest Letter",
    isActive: true,
  });

  res.status(201).json({
    success: true,
    message: "Thank you for subscribing to Zaitoon Pakistan's Harvest Letter",
    subscriber,
    data: subscriber,
  });
});

// Admin: GET /api/admin/newsletter
export const getAdminSubscribers = asyncHandler(async (_req, res) => {
  const subscribers = await NewsletterSubscriber.find().sort({ subscribedAt: -1 });
  res.json({ success: true, subscribers, data: subscribers });
});

// Admin: GET /api/admin/newsletter/export
export const exportSubscribersCSV = asyncHandler(async (_req, res) => {
  const subscribers = await NewsletterSubscriber.find({ isActive: true }).sort({ subscribedAt: -1 });

  let csv = "email,source,isActive,subscribedAt\n";
  for (const s of subscribers) {
    const isoDate = s.subscribedAt ? new Date(s.subscribedAt).toISOString() : new Date().toISOString();
    csv += `${sanitizeCsvCell(s.email)},${sanitizeCsvCell(s.source || "Harvest Letter")},${sanitizeCsvCell(s.isActive)},${sanitizeCsvCell(isoDate)}\n`;
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="zaitoon-newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`
  );
  res.send(csv);
});
