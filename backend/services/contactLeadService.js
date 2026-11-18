import ContactLead from "../models/ContactLead.js";
import { parsePagination } from "../utils/pagination.js";
import { invalidateCache } from "../middlewares/cache.js";

export async function listContactLeads(query = {}) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const [leads, total] = await Promise.all([
    ContactLead.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ContactLead.countDocuments(),
  ]);
  return { leads, total, page, totalPages: Math.ceil(total / limit) };
}

export async function createContactLead(body) {
  const created = await ContactLead.create(body);
  invalidateCache("/api/dashboard");
  return created.toObject();
}
