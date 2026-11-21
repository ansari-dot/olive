import ContactInquiry from "../models/ContactInquiry.js";
import { ApiError } from "../utils/ApiError.js";

const VALID_TOPICS = [
  "Order & Cash on Delivery",
  "Product Harvest & Lab Purity",
  "Bulk & Corporate Gifting",
  "Orchard & Wholesale Partnership",
];

export async function submitInquiry({ name, contactInfo, city, topic, message, email, phone }) {
  if (!name || !message || !topic) {
    throw ApiError.badRequest("Name, topic, and message are required");
  }

  if (!VALID_TOPICS.includes(topic)) {
    throw ApiError.badRequest(`Invalid topic. Must be one of: ${VALID_TOPICS.join(", ")}`);
  }

  const inquiry = await ContactInquiry.create({
    name: name.trim(),
    contactInfo: (contactInfo || email || phone || "").trim(),
    city: city ? city.trim() : "Islamabad",
    topic,
    message: message.trim(),
    status: "new",
  });

  return inquiry;
}

export async function getAdminInquiries(filter = {}) {
  const query = {};
  if (filter.status) {
    query.status = filter.status;
  }
  return await ContactInquiry.find(query).sort({ createdAt: -1 });
}

export async function updateInquiry(id, { status, adminNote }) {
  const update = {};
  if (status) update.status = status;
  if (adminNote !== undefined) update.adminNote = adminNote;

  const inquiry = await ContactInquiry.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  if (!inquiry) throw ApiError.notFound("Inquiry not found");
  return inquiry;
}
