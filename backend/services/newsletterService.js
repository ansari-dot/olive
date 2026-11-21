import NewsletterSubscriber from "../models/NewsletterSubscriber.js";
import { ApiError } from "../utils/ApiError.js";
import { sanitizeCsvCell } from "../utils/security.js";

export async function subscribe({ email, source }) {
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
    return {
      subscriber: existing,
      isNew: false,
      message: "You are subscribed to Zaitoon Pakistan's Harvest Letter",
    };
  }

  const subscriber = await NewsletterSubscriber.create({
    email: cleanEmail,
    source: source || "Harvest Letter",
    isActive: true,
  });

  return {
    subscriber,
    isNew: true,
    message: "Thank you for subscribing to Zaitoon Pakistan's Harvest Letter",
  };
}

export async function getAdminSubscribers() {
  return await NewsletterSubscriber.find().sort({ subscribedAt: -1 });
}

export async function exportSubscribersCSV() {
  const subscribers = await NewsletterSubscriber.find({ isActive: true }).sort({ subscribedAt: -1 });

  let csv = "email,source,isActive,subscribedAt\n";
  for (const s of subscribers) {
    const isoDate = s.subscribedAt ? new Date(s.subscribedAt).toISOString() : new Date().toISOString();
    csv += `${sanitizeCsvCell(s.email)},${sanitizeCsvCell(s.source || "Harvest Letter")},${sanitizeCsvCell(s.isActive)},${sanitizeCsvCell(isoDate)}\n`;
  }

  return csv;
}
