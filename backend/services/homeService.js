import HeroBanner from "../models/HeroBanner.js";
import HomeCollection from "../models/HomeCollection.js";
import PopularPicks from "../models/PopularPicks.js";
import HomeCategories from "../models/HomeCategories.js";
import CategorySection from "../models/CategorySection.js";
import CompareSection from "../models/CompareSection.js";
import Testimonial from "../models/Testimonial.js";
import Category from "../models/Category.js";
import BestSellersSection from "../models/BestSellersSection.js";
import Product from "../models/Product.js";
import {
  findProductMapByIds,
  pickProductsFromMap,
} from "./productService.js";
import { getDealSectionWithStock } from "./dealSectionService.js";

/**
 * Loads everything the home page needs in two waves:
 *   1) Section configs + testimonials + categories (all in parallel)
 *   2) A single product query covering EVERY referenced productId across
 *      collection / popular / compare / category sections — replacing the
 *      previous N+1 (one `$in` query per section).
 */
export async function getHomeData() {
  const [
    hero,
    collection,
    popular,
    bestSellers,
    homeCategories,
    compare,
    testimonials,
    categorySections,
    categories,
  ] = await Promise.all([
    HeroBanner.findOne().lean(),
    HomeCollection.findOne().lean(),
    PopularPicks.findOne().lean(),
    BestSellersSection.findOne().lean(),
    HomeCategories.findOne().lean(),
    CompareSection.findOne().lean(),
    Testimonial.find({ active: true }).sort({ createdAt: -1 }).lean(),
    CategorySection.find({ active: true }).sort({ position: 1 }).lean(),
    Category.find().sort({ createdAt: -1 }).lean(),
  ]);

  const deal = await getDealSectionWithStock();

  // Query dynamic merchandising sections
  const [featuredGrid, dynamicBestSellers, uniqueProducts, shopProducts] = await Promise.all([
    Product.find({ isActive: true, sections: "featured-grid" })
      .sort({ "sectionOrder.featured-grid": 1, popularity: -1, createdAt: -1 })
      .limit(12)
      .lean(),
    Product.find({ isActive: true, sections: "best-sellers" })
      .sort({ "sectionOrder.best-sellers": 1, popularity: -1, createdAt: -1 })
      .limit(12)
      .lean(),
    Product.find({ isActive: true, sections: "unique" })
      .sort({ "sectionOrder.unique": 1, popularity: -1, createdAt: -1 })
      .limit(12)
      .lean(),
    Product.find({ isActive: true, sections: "shop" })
      .sort({ "sectionOrder.shop": 1, popularity: -1, createdAt: -1 })
      .limit(40)
      .lean(),
  ]);

  const sections = Array.isArray(categorySections) ? categorySections : [];

  const productMap = await findProductMapByIds([
    collection?.productIds,
    popular?.productIds,
    bestSellers?.productIds,
    compare?.productIds,
    ...sections.map((s) => s?.productIds),
  ]);

  const collectionProducts = pickProductsFromMap(
    collection?.productIds,
    productMap
  );
  const popularProducts = pickProductsFromMap(popular?.productIds, productMap);
  const bestSellersProducts = pickProductsFromMap(bestSellers?.productIds, productMap);
  const compareProducts = pickProductsFromMap(compare?.productIds, productMap);

  // Build a quick category lookup map
  const categoryMap = new Map(
    (Array.isArray(categories) ? categories : []).map((c) => [String(c._id), c])
  );

  const sectionProducts = sections
    .map((section) => ({
      ...section,
      products: pickProductsFromMap(section.productIds, productMap),
      categories: (section.categoryIds || [])
        .map((id) => categoryMap.get(String(id)))
        .filter(Boolean),
    }))
    .filter((section) => section.products.length > 0 || section.categories.length > 0);

  return {
    hero: hero || null,
    categories: Array.isArray(categories) ? categories : [],
    homeCategories: homeCategories || null,
    collection: collection || null,
    collectionProducts,
    popular: popular || null,
    popularProducts,
    bestSellers: bestSellers || null,
    bestSellersProducts: dynamicBestSellers.length > 0 ? dynamicBestSellers : bestSellersProducts,
    featuredGrid,
    uniqueProducts,
    shopProducts,
    deal: deal || null,
    compare: compare || null,
    compareProducts,
    testimonials: Array.isArray(testimonials) ? testimonials : [],
    categorySections: sectionProducts,
  };
}
