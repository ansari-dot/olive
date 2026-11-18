/**
 * Image helpers used by product/home services. Mongo sometimes stores legacy
 * base64 data URLs that were split across array entries — repair them here.
 */
export function normalizeImageList(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (let i = 0; i < list.length; i += 1) {
    const cur = String(list[i] || "").trim();
    if (!cur) continue;

    if (/^data:image\/[a-zA-Z0-9+.-]+;base64$/i.test(cur)) {
      const next = String(list[i + 1] || "").trim();
      if (/^[A-Za-z0-9+/=]+$/.test(next)) {
        out.push(`${cur},${next}`);
        i += 1;
        continue;
      }
    }
    out.push(cur);
  }
  return out;
}

export function normalizeProductDoc(product) {
  if (!product || typeof product !== "object") return product;
  const imgs = normalizeImageList(product.imgs);
  const img = String(product.img || "").trim() || imgs[0] || "";
  return {
    ...product,
    img,
    imgs,
    averageRating: product.averageRating ?? product.rating ?? 0,
    totalReviews: product.totalReviews ?? product.reviews ?? 0,
  };
}

export default { normalizeImageList, normalizeProductDoc };
