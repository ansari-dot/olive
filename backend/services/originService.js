import Origin from "../models/Origin.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { invalidateCache } from "../middlewares/cache.js";

function bust() {
  invalidateCache("/api/origins");
  invalidateCache("/api/products");
  invalidateCache("/api/products/filters");
  invalidateCache("/api/home");
}

export async function listOrigins() {
  const origins = await Origin.find({ isActive: true }).sort({ name: 1 }).lean();
  
  // Calculate dynamic product counts for each origin
  const counts = await Product.aggregate([
    { $match: { isActive: true, origin: { $exists: true, $ne: null } } },
    { $group: { _id: "$origin", count: { $sum: 1 } } }
  ]);

  const countMap = new Map(counts.map(c => [c._id, c.count]));

  return origins.map(o => ({
    ...o,
    productCount: countMap.get(o.name) || 0
  }));
}

export async function getOriginById(id) {
  const origin = await Origin.findById(id).lean();
  if (!origin) throw ApiError.notFound("Origin not found");
  return origin;
}

export async function createOrigin(body) {
  if (!body.name) throw ApiError.badRequest("Origin name is required");
  const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  
  const origin = await Origin.create({
    ...body,
    slug
  });
  bust();
  return origin.toObject();
}

export async function updateOrigin(id, body) {
  if (body.name && !body.slug) {
    body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  }

  const origin = await Origin.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  }).lean();
  
  if (!origin) throw ApiError.notFound("Origin not found");
  bust();
  return origin;
}

export async function deleteOrigin(id) {
  const deleted = await Origin.findByIdAndDelete(id).lean();
  if (!deleted) throw ApiError.notFound("Origin not found");
  bust();
  return { message: "Origin deleted successfully" };
}
