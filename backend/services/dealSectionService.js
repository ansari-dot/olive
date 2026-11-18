import DealSection from "../models/DealSection.js";
import Product from "../models/Product.js";
import { invalidateCache } from "../middlewares/cache.js";

export async function getDealSection() {
  return DealSection.findOne().lean();
}

/**
 * Get deal section with current deal stock status for each product
 */
export async function getDealSectionWithStock() {
  const doc = await DealSection.findOne().lean();
  if (!doc || !doc.products?.length) return doc;
  
  // Get current product quantities
  const productIds = doc.products.map(p => p.productId);
  const products = await Product.find(
    { _id: { $in: productIds } }
  ).lean();
  
  const productMap = new Map(products.map(p => [String(p._id), p]));
  
  // Calculate remaining deal stock for each product
  const dealProducts = doc.products.map(dealProduct => {
    const product = productMap.get(String(dealProduct.productId));
    if (!product) return null;
    
    const productQuantity = product.quantity || 0;
    const dealQuantity = dealProduct.dealQuantity || 0;
    const remainingStock = Math.min(productQuantity, dealQuantity);
    
    return {
      productId: dealProduct.productId,
      product: product,
      dealQuantity: dealQuantity,
      remainingStock: remainingStock,
      totalStock: productQuantity
    };
  }).filter(Boolean);
  
  return {
    ...doc,
    dealProducts: dealProducts
  };
}

/**
 * Persist the deal section AND sync the `isDeal` flag on referenced products.
 */
export async function upsertDealSection(payload) {
  const prev = await DealSection.findOne().lean();
  
  const doc = await DealSection.findOneAndUpdate({}, payload, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  }).lean();

  const prevIds = new Set((prev?.products || []).map(p => String(p.productId)));
  const nextIds = new Set((doc?.products || []).map(p => String(p.productId)));

  const toDisable = [...prevIds].filter((id) => !nextIds.has(id));
  const toEnable = [...nextIds];

  if (toDisable.length) {
    await Product.updateMany(
      { _id: { $in: toDisable } },
      { $set: { isDeal: false } }
    );
  }
  if (toEnable.length) {
    await Product.updateMany(
      { _id: { $in: toEnable } },
      { $set: { isDeal: true } }
    );
  }

  invalidateCache("/api/deal-section");
  invalidateCache("/api/products");
  invalidateCache("/api/home");

  return doc;
}
