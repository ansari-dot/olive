import Testimonial from "../models/Testimonial.js";
import { ApiError } from "../utils/ApiError.js";
import { invalidateCache } from "../middlewares/cache.js";

function bust() {
  invalidateCache("/api/testimonials");
  invalidateCache("/api/home");
}

export async function listTestimonials({ active } = {}) {
  const filter = typeof active === "string" ? { active: active === "true" } : {};
  return Testimonial.find(filter).sort({ createdAt: -1 }).lean();
}

export async function getTestimonialById(id) {
  const item = await Testimonial.findById(id).lean();
  if (!item) throw ApiError.notFound("Testimonial not found");
  return item;
}

export async function createTestimonial(body) {
  const item = await Testimonial.create(body);
  bust();
  return item.toObject();
}

export async function updateTestimonial(id, body) {
  const item = await Testimonial.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  }).lean();
  if (!item) throw ApiError.notFound("Testimonial not found");
  bust();
  return item;
}

export async function deleteTestimonial(id) {
  const deleted = await Testimonial.findByIdAndDelete(id).lean();
  if (!deleted) throw ApiError.notFound("Testimonial not found");
  bust();
  return { message: "Testimonial deleted" };
}
