import mongoose from "mongoose";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import Origin from "../models/Origin.js";
import Order from "../models/Order.js";
import { applyDealsToProducts } from "./dealService.js";
import { invalidateCache } from "../middlewares/cache.js";
import { escapeRegex } from "../utils/security.js";
import { ApiError } from "../utils/ApiError.js";

function buildProductFilter(query, isPublic = true) {
  const filter = {};
  if (isPublic) {
    filter.isActive = true;
  } else if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true" || query.isActive === true;
  }

  // Category filter
  if (
    query.category &&
    query.category !== "All" &&
    query.category !== "all" &&
    query.category !== "All Categories" &&
    query.category !== "All Collection"
  ) {
    filter.category = query.category;
  }

  // Subcategory filter
  if (
    query.subcategory &&
    query.subcategory !== "All" &&
    query.subcategory !== "all"
  ) {
    filter.subcategory = query.subcategory;
  }

  // Brand filter
  if (
    query.brand &&
    query.brand !== "All" &&
    query.brand !== "all" &&
    query.brand !== "All Brands"
  ) {
    filter.brand = query.brand;
  }

  // Flavour filter
  if (query.flavour && query.flavour !== "All") {
    filter.flavour = query.flavour;
  }

  // Origin filter
  if (query.origin && query.origin !== "All") {
    filter.origin = query.origin;
  }

  // Section filter
  if (query.section) {
    filter.sections = query.section;
  }

  // Max price filter
  if (query.maxPrice) {
    const max = Number(query.maxPrice);
    if (!isNaN(max) && max > 0) {
      filter.price = { ...(filter.price || {}), $lte: max };
    }
  }

  // Min price filter
  if (query.minPrice) {
    const min = Number(query.minPrice);
    if (!isNaN(min) && min >= 0) {
      filter.price = { ...(filter.price || {}), $gte: min };
    }
  }

  // Text search
  if (query.search && typeof query.search === "string" && query.search.trim()) {
    const s = query.search.trim();
    const regex = new RegExp(escapeRegex(s), "i");
    filter.$or = [
      { name: regex },
      { description: regex },
      { brand: regex },
      { category: regex },
      { subcategory: regex },
      { flavour: regex },
      { origin: regex },
      { tag: regex },
      { sku: regex },
      { slug: regex },
    ];
  }

  return filter;
}

function resolveProductSort(sort, section) {
  if (!sort && section) {
    return { [`sectionOrder.${section}`]: 1, popularity: -1, createdAt: -1 };
  }
  switch (sort) {
    case "price-asc":
      return { price: 1 };
    case "price-desc":
      return { price: -1 };
    case "rating":
      return { rating: -1, reviewsCount: -1 };
    case "popularity":
      return { popularity: -1 };
    case "newest":
      return { createdAt: -1 };
    default:
      return section
        ? { [`sectionOrder.${section}`]: 1, popularity: -1, createdAt: -1 }
        : { popularity: -1, createdAt: -1 };
  }
}

export async function findProductMapByIds(ids = []) {
  const cleanIds = ids.filter(Boolean);
  if (cleanIds.length === 0) return new Map();
  const products = await Product.find({ _id: { $in: cleanIds } }).lean();
  const resolvedProducts = await applyDealsToProducts(products);
  const map = new Map();
  for (const p of resolvedProducts) {
    map.set(String(p._id), p);
  }
  return map;
}

export function pickProductsFromMap(ids = [], map) {
  if (!Array.isArray(ids) || !map) return [];
  const out = [];
  for (const id of ids) {
    const item = map.get(String(id));
    if (item) out.push(item);
  }
  return out;
}

export async function findOutOfStockItems(items = []) {
  const out = [];
  for (const it of items) {
    const prod = await Product.findById(it.productId || it.product);
    if (!prod || prod.stock < (it.quantity || it.qty || 1)) {
      out.push(it);
    }
  }
  return out;
}

export async function decrementStockAtomic(items = []) {
  for (const it of items) {
    const qty = it.quantity || it.qty || 1;
    await Product.findByIdAndUpdate(it.productId || it.product, {
      $inc: { stock: -qty, soldCount: qty },
    });
  }
}

export async function listProducts(query = {}, isPublic = true) {
  const filter = buildProductFilter(query, isPublic);
  const sort = resolveProductSort(query.sort, query.section);

  const defaultLimit = isPublic ? 20 : 100;
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(200, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  const resolvedProducts = await applyDealsToProducts(products);

  return {
    products: resolvedProducts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getProductNavigation() {
  const [categories, subcategories, brands] = await Promise.all([
    Product.distinct("category", { isActive: true }),
    Product.distinct("subcategory", { isActive: true }),
    Product.distinct("brand", { isActive: true }),
  ]);
  return {
    categories: categories.sort(),
    subcategories: subcategories.filter(Boolean).sort(),
    brands: brands.sort(),
  };
}

export async function getProductFilters() {
  const activeFilter = { isActive: true };

  const [categories, subcategoriesAgg, brands, flavoursAgg, originsAgg, priceAgg, definedOrigins] =
    await Promise.all([
      Product.distinct("category", activeFilter),
      Product.aggregate([
        { $match: { isActive: true, subcategory: { $exists: true, $ne: "" } } },
        {
          $group: {
            _id: { category: "$category", subcategory: "$subcategory" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            category: "$_id.category",
            subcategory: "$_id.subcategory",
            count: 1,
            _id: 0,
          },
        },
        { $sort: { category: 1, subcategory: 1 } },
      ]),
      Product.distinct("brand", activeFilter),
      Product.aggregate([
        { $match: { isActive: true, flavour: { $ne: null } } },
        { $group: { _id: "$flavour", count: { $sum: 1 } } },
        { $project: { name: "$_id", count: 1, _id: 0 } },
        { $sort: { name: 1 } },
      ]),
      Product.aggregate([
        { $match: { isActive: true, origin: { $ne: null } } },
        { $group: { _id: "$origin", count: { $sum: 1 } } },
        { $project: { name: "$_id", count: 1, _id: 0 } },
        { $sort: { name: 1 } },
      ]),
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
          },
        },
      ]),
      Origin.find({ isActive: true }).sort({ name: 1 }).lean(),
    ]);

  const existingOriginNames = new Set(originsAgg.map((o) => o.name));
  for (const d of definedOrigins || []) {
    if (!existingOriginNames.has(d.name)) {
      originsAgg.push({ name: d.name, count: 0 });
    }
  }

  return {
    categories: categories.sort(),
    subcategories: subcategoriesAgg,
    brands: brands.sort(),
    flavours: flavoursAgg,
    origins: originsAgg,
    minPrice: priceAgg[0]?.minPrice || 0,
    maxPrice: priceAgg[0]?.maxPrice || 10000,
  };
}

export async function getProductByIdOrSlug(idOrSlug, isPublic = true) {
  const query = {};
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    query.$or = [{ _id: idOrSlug }, { slug: idOrSlug.toLowerCase() }];
  } else {
    query.slug = idOrSlug.toLowerCase();
  }

  if (isPublic) {
    query.isActive = true;
  }

  const product = await Product.findOne(query);
  if (!product) {
    throw ApiError.notFound(`Product "${idOrSlug}" not found`);
  }

  // Get approved reviews
  const reviews = await Review.find({
    product: product._id,
    isApproved: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  // Get 4 related products in same category or brand
  const relatedProducts = await Product.find({
    _id: { $ne: product._id },
    isActive: true,
    $or: [{ category: product.category }, { brand: product.brand }],
  })
    .limit(4)
    .lean();

  const [resolvedProduct] = await applyDealsToProducts([product]);
  const resolvedRelated = await applyDealsToProducts(relatedProducts);

  return {
    product: resolvedProduct,
    reviews,
    relatedProducts: resolvedRelated,
  };
}

export async function addProductReview(idOrSlug, { author, email, rating, comment, city }) {
  if (!author || !author.trim()) {
    throw ApiError.badRequest("Your name is required");
  }
  if (!email || !email.trim()) {
    throw ApiError.badRequest("Your purchase email is required to verify your order");
  }
  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw ApiError.badRequest("Please provide a valid email address");
  }

  if (!comment || !comment.trim()) {
    throw ApiError.badRequest("Review tasting notes/comment are required");
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    throw ApiError.badRequest("Rating must be a number between 1 and 5");
  }

  const productData = await getProductByIdOrSlug(idOrSlug, true);
  const product = productData.product;

  // Real-world e-commerce verified buyer check:
  // Check if an order exists containing this product with this customer's email
  const safeEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const order = await Order.findOne({
    "customer.email": { $regex: new RegExp(`^${safeEmail}$`, "i") },
    $or: [
      { "items.product": product._id },
      { "items.slug": product.slug },
    ],
    orderStatus: { $ne: "cancelled" },
  }).sort({ createdAt: -1 });

  if (!order) {
    throw ApiError.badRequest(
      `Only verified buyers who ordered this harvest can leave a review. No order was found for "${cleanEmail}" containing this product. Please check the email address you entered during checkout.`
    );
  }

  // Check if user already reviewed this product with this email
  const existingReview = await Review.findOne({
    product: product._id,
    email: cleanEmail,
  });

  let review;
  if (existingReview) {
    existingReview.author = author.trim();
    existingReview.rating = numRating;
    existingReview.comment = comment.trim();
    if (city?.trim()) existingReview.city = city.trim();
    existingReview.orderReference = order.orderReference;
    existingReview.verifiedPurchase = true;
    existingReview.isApproved = true;
    await existingReview.save();
    review = existingReview;
  } else {
    review = await Review.create({
      product: product._id,
      author: author.trim(),
      email: cleanEmail,
      city: city?.trim() || order.shippingAddress?.city || "",
      rating: numRating,
      comment: comment.trim(),
      orderReference: order.orderReference,
      verifiedPurchase: true,
      isApproved: true,
    });
  }

  // Recalculate parent Product.rating & reviewsCount
  const stats = await Review.aggregate([
    { $match: { product: product._id, isApproved: true } },
    {
      $group: {
        _id: "$product",
        count: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const newReviewsCount = stats[0]?.count || 1;
  const rawAvg = stats[0]?.avgRating || numRating;
  const newRating = Math.round(rawAvg * 10) / 10;

  product.rating = newRating;
  product.reviewsCount = newReviewsCount;
  await product.save();
  invalidateCache("/api/products");
  invalidateCache("/api/home");

  return {
    review,
    rating: product.rating,
    reviewsCount: product.reviewsCount,
  };
}

const ALLOWED_PRODUCT_FIELDS = [
  "slug",
  "sku",
  "name",
  "brand",
  "category",
  "subcategory",
  "flavour",
  "origin",
  "price",
  "originalPrice",
  "stock",
  "size",
  "description",
  "detailedDescription",
  "ingredients",
  "harvestDate",
  "storageInstructions",
  "image",
  "galleryImages",
  "tag",
  "sections",
  "sectionOrder",
  "extractionMethod",
  "acidityLevel",
  "isSale",
  "isNew",
  "isOrganic",
  "isActive",
  "popularity",
];

function pickProductPayload(input) {
  const clean = {};
  for (const field of ALLOWED_PRODUCT_FIELDS) {
    if (input[field] !== undefined) {
      clean[field] = input[field];
    }
  }
  return clean;
}

export async function createProduct(inputPayload) {
  const payload = pickProductPayload(inputPayload);
  if (!payload.name || !payload.brand || !payload.category || payload.price === undefined) {
    throw ApiError.badRequest("Product name, brand, category, and price are required");
  }

  // Generate slug if not provided
  if (!payload.slug) {
    payload.slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  // Generate SKU if not provided
  if (!payload.sku) {
    const prefix = String(payload.brand).substring(0, 2).toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);
    payload.sku = `ZP-${prefix}-${rand}`;
  }

  const product = await Product.create(payload);
  invalidateCache("/api/products");
  invalidateCache("/api/home");
  invalidateCache("/api/deal-section");
  return product;
}

export async function updateProduct(id, inputPayload) {
  const payload = pickProductPayload(inputPayload);
  const product = await Product.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }
  invalidateCache("/api/products");
  invalidateCache("/api/home");
  invalidateCache("/api/deal-section");
  return product;
}

export async function adjustStock(id, stock) {
  const num = Number(stock);
  if (isNaN(num) || num < 0) {
    throw ApiError.badRequest("Stock must be a non-negative number");
  }
  const product = await Product.findByIdAndUpdate(
    id,
    { stock: num },
    { new: true }
  );
  if (!product) {
    throw ApiError.notFound("Product not found");
  }
  invalidateCache("/api/products");
  invalidateCache("/api/home");
  invalidateCache("/api/deal-section");
  return product;
}

export async function deleteProduct(id) {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw ApiError.notFound("Product not found");
  }
  invalidateCache("/api/products");
  invalidateCache("/api/home");
  invalidateCache("/api/deal-section");
  return { success: true, message: "Product deleted successfully" };
}

const ALLOWED_SECTION_KEYS = new Set([
  "featured-grid",
  "best-sellers",
  "unique",
  "shop",
]);

export async function getAdminSections() {
  const allProducts = await Product.find().sort({ name: 1 }).lean();

  const sections = {
    "featured-grid": allProducts
      .filter((p) => p.sections?.includes("featured-grid"))
      .sort(
        (a, b) =>
          (a.sectionOrder?.["featured-grid"] ?? 0) -
          (b.sectionOrder?.["featured-grid"] ?? 0)
      ),
    "best-sellers": allProducts
      .filter((p) => p.sections?.includes("best-sellers"))
      .sort(
        (a, b) =>
          (a.sectionOrder?.["best-sellers"] ?? 0) -
          (b.sectionOrder?.["best-sellers"] ?? 0)
      ),
    unique: allProducts
      .filter((p) => p.sections?.includes("unique"))
      .sort(
        (a, b) =>
          (a.sectionOrder?.["unique"] ?? 0) -
          (b.sectionOrder?.["unique"] ?? 0)
      ),
    shop: allProducts
      .filter((p) => p.sections?.includes("shop"))
      .sort(
        (a, b) =>
          (a.sectionOrder?.["shop"] ?? 0) -
          (b.sectionOrder?.["shop"] ?? 0)
      ),
  };

  return {
    success: true,
    sections,
    products: allProducts,
  };
}

export async function updateAdminSectionLayout(sectionKey, items = []) {
  if (!ALLOWED_SECTION_KEYS.has(sectionKey)) {
    throw ApiError.badRequest(
      `Invalid section key "${sectionKey}". Must be one of: ${Array.from(ALLOWED_SECTION_KEYS).join(", ")}`
    );
  }

  if (!Array.isArray(items)) {
    throw ApiError.badRequest("Items must be an array of { productId, order }");
  }

  const validSelectedIds = [];
  for (const item of items) {
    const rawId = item.productId || item._id || item.id;
    if (!rawId || !mongoose.isValidObjectId(rawId)) {
      throw ApiError.badRequest(`Invalid MongoDB product ID: "${rawId}"`);
    }
    const orderNum = Math.max(0, parseInt(item.order, 10) || 0);
    const objId = new mongoose.Types.ObjectId(String(rawId));
    validSelectedIds.push(objId);

    await Product.findByIdAndUpdate(objId, {
      $addToSet: { sections: sectionKey },
      $set: { [`sectionOrder.${sectionKey}`]: orderNum },
    });
  }

  // Atomically remove this sectionKey from any product not in items
  await Product.updateMany(
    {
      _id: { $nin: validSelectedIds },
      sections: sectionKey,
    },
    {
      $pull: { sections: sectionKey },
      $set: { [`sectionOrder.${sectionKey}`]: 0 },
    }
  );

  invalidateCache("/api/products");
  invalidateCache("/api/home");

  const updatedProducts = await Product.find({
    sections: sectionKey,
  })
    .sort({ [`sectionOrder.${sectionKey}`]: 1, popularity: -1, createdAt: -1 })
    .lean();

  return {
    success: true,
    sectionKey,
    items: updatedProducts,
  };
}
