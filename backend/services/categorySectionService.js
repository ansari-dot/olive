import CategorySection from "../models/CategorySection.js";
import { ApiError } from "../utils/ApiError.js";
import { invalidateCache } from "../middlewares/cache.js";

function bust() {
  invalidateCache("/api/category-sections");
  invalidateCache("/api/home");
}

export async function listCategorySections() {
  return CategorySection.find().sort({ position: 1 }).lean();
}

export async function createCategorySection(body) {
  const doc = await CategorySection.create(body);
  bust();
  return doc.toObject();
}

export async function updateCategorySection(id, body) {
  const doc = await CategorySection.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  }).lean();
  if (!doc) throw ApiError.notFound("Not found");
  bust();
  return doc;
}

export async function deleteCategorySection(id) {
  const doc = await CategorySection.findByIdAndDelete(id);
  if (!doc) throw ApiError.notFound("Not found");
  bust();
  return { message: "Deleted" };
}
