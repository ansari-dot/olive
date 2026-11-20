import Category from "../models/Category.js";
import { ApiError } from "../utils/ApiError.js";
import { invalidateCache } from "../middlewares/cache.js";

function bust() {
  invalidateCache("/api/categories");
  invalidateCache("/api/home");
}

export async function listCategories({ ids } = {}) {
  if (ids) {
    const list = String(ids)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const categories = await Category.find({ _id: { $in: list } }).lean();
    const order = new Map(list.map((id, i) => [id, i]));
    categories.sort(
      (a, b) =>
        (order.get(String(a._id)) ?? 0) - (order.get(String(b._id)) ?? 0)
    );
    return categories;
  }
  return Category.find().sort({ categoryNumber: 1, name: 1, createdAt: -1 }).lean();
}

export async function getCategoryById(id) {
  const category = await Category.findById(id).lean();
  if (!category) throw ApiError.notFound("Category not found");
  return category;
}

export async function createCategory(body) {
  const category = await Category.create(body);
  bust();
  return category.toObject();
}

export async function updateCategory(id, body) {
  const category = await Category.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  }).lean();
  if (!category) throw ApiError.notFound("Category not found");
  bust();
  return category;
}

export async function deleteCategory(id) {
  const deleted = await Category.findByIdAndDelete(id).lean();
  if (!deleted) throw ApiError.notFound("Category not found");
  bust();
  return { message: "Category deleted" };
}
