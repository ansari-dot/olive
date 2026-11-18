import Subscriber from "../models/Subscriber.js";
import { parsePagination } from "../utils/pagination.js";
import { invalidateCache } from "../middlewares/cache.js";

export async function listSubscribers(query = {}) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const [list, total] = await Promise.all([
    Subscriber.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Subscriber.countDocuments(),
  ]);
  return {
    subscribers: list,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function subscribe({ name, email, source }) {
  const existing = await Subscriber.findOne({ email }).lean();
  if (existing) {
    return { record: { ...existing, alreadySubscribed: true }, isNew: false };
  }
  const created = await Subscriber.create({
    name,
    email,
    source: source || "newsletter",
  });
  invalidateCache("/api/dashboard");
  return { record: created.toObject(), isNew: true };
}
