import { Product, BlogPost } from '../data/storeData';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

// ----------------------------------------------------------------------
// High-Performance In-Memory Request Cache & Deduplication Layer
// ----------------------------------------------------------------------
interface CacheRecord<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheRecord<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Clear in-memory cached responses. If pattern provided, only matching keys are purged.
 */
export function clearApiCache(pattern?: string | RegExp): void {
  if (!pattern) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Executes a network fetch with in-memory TTL caching and in-flight deduplication.
 * Prevents redundant duplicate HTTP queries across components and rapid re-renders.
 */
async function fetchCached<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlMs = 60000,
  forceFresh = false
): Promise<T> {
  const now = Date.now();

  if (!forceFresh) {
    const cached = memoryCache.get(cacheKey) as CacheRecord<T> | undefined;
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }
  }

  const existingInFlight = inFlightRequests.get(cacheKey) as Promise<T> | undefined;
  if (existingInFlight) {
    return existingInFlight;
  }

  const promise = fetcher()
    .then((result) => {
      if (ttlMs > 0) {
        memoryCache.set(cacheKey, { data: result, expiresAt: Date.now() + ttlMs });
      }
      inFlightRequests.delete(cacheKey);
      return result;
    })
    .catch((err) => {
      inFlightRequests.delete(cacheKey);
      throw err;
    });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

/**
 * Resolves image URL cleanly whether it is a remote URL, backend /uploads, or static /assets
 */
export function resolveImageUrl(url?: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${BACKEND_ORIGIN}${cleanPath}`;
  }
  if (trimmed.startsWith('/assets/') || trimmed.startsWith('assets/')) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
  return `${BACKEND_ORIGIN}/${trimmed.replace(/^\/+/, '')}`;
}

/**
 * Normalizes backend Product document to match frontend Product interface
 */
export function normalizeProduct(raw: any): Product {
  const id = raw.slug || (raw._id ? String(raw._id) : raw.id);
  const mongoId = raw._id ? String(raw._id) : raw.mongoId;

  return {
    id,
    mongoId,
    name: raw.name || '',
    brand: raw.brand || '',
    category: raw.category || '',
    subcategory: raw.subcategory || undefined,
    flavour: raw.flavour || undefined,
    origin: raw.origin || undefined,
    price: Number(raw.price) || 0,
    originalPrice: raw.originalPrice ? Number(raw.originalPrice) : undefined,
    rating: raw.rating !== undefined ? Number(raw.rating) : 5,
    reviewsCount: raw.reviewsCount !== undefined ? Number(raw.reviewsCount) : 1,
    stock: raw.stock !== undefined ? Number(raw.stock) : 36,
    soldCount: raw.soldCount !== undefined ? Number(raw.soldCount) : 0,
    isSale: Boolean(raw.isSale),
    isNew: Boolean(raw.isNew),
    isOrganic: Boolean(raw.isOrganic),
    popularity: raw.popularity !== undefined ? Number(raw.popularity) : 80,
    size: raw.size || '',
    description: raw.description || '',
    detailedDescription: raw.detailedDescription || undefined,
    ingredients: raw.ingredients || undefined,
    harvestDate: raw.harvestDate || undefined,
    storageInstructions: raw.storageInstructions || undefined,
    image: resolveImageUrl(raw.image),
    galleryImages: Array.isArray(raw.galleryImages)
      ? raw.galleryImages.map(resolveImageUrl)
      : [],
    tag: raw.tag || undefined,
    extractionMethod: raw.extractionMethod || undefined,
    acidityLevel: raw.acidityLevel || undefined,
    dealBadge: raw.dealBadge || undefined,
    dealEndsAt: raw.dealEndsAt || undefined,
    dealStartsAt: raw.dealStartsAt || undefined,
    discountPercent: raw.discountPercent ? Number(raw.discountPercent) : undefined,
    isDeal: Boolean(raw.isDeal),
    dealStockLimit: raw.dealStockLimit !== undefined ? Number(raw.dealStockLimit) : undefined,
    dealSoldCount: raw.dealSoldCount !== undefined ? Number(raw.dealSoldCount) : undefined,
    dealRemainingStock: raw.dealRemainingStock !== undefined ? raw.dealRemainingStock : undefined,
    dealId: raw.dealId ? String(raw.dealId) : undefined,
  };
}

/**
 * Normalizes backend BlogPost document to match frontend BlogPost interface
 */
export function normalizeBlogPost(raw: any): BlogPost {
  const id = raw.slug || (raw._id ? String(raw._id) : raw.id);
  const createdDate = raw.createdAt ? new Date(raw.createdAt) : null;
  const defaultYear =
    createdDate && !isNaN(createdDate.getTime())
      ? String(createdDate.getFullYear())
      : '2026';

  let rawTags: string[] = [];
  if (Array.isArray(raw.tags)) {
    rawTags = raw.tags.map((t: unknown) => String(t).trim()).filter(Boolean);
  } else if (typeof raw.tags === 'string') {
    rawTags = raw.tags
      .split(',')
      .map((t: string) => t.trim())
      .filter(Boolean);
  }

  let rawTakeaways: string[] = [];
  if (Array.isArray(raw.takeaways)) {
    rawTakeaways = raw.takeaways
      .map((t: unknown) => String(t).trim())
      .filter(Boolean);
  } else if (typeof raw.takeaways === 'string') {
    rawTakeaways = raw.takeaways
      .split(/\r?\n/)
      .map((t: string) => t.trim())
      .filter(Boolean);
  }

  const rawComments = Array.isArray(raw.comments)
    ? raw.comments.map((c: any) => ({
        id: c._id ? String(c._id) : c.id || `c-${Date.now()}-${Math.random()}`,
        _id: c._id ? String(c._id) : undefined,
        author: c.author || 'Reader',
        city: c.city || 'Pakistan',
        comment: c.comment || '',
        createdAt: c.createdAt,
        date: c.createdAt
          ? new Date(c.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'Recently',
      }))
    : [];

  return {
    id,
    slug: raw.slug || id,
    day: raw.day || (createdDate ? String(createdDate.getDate()).padStart(2, '0') : '01'),
    month:
      raw.month ||
      (createdDate
        ? createdDate.toLocaleString('en-US', { month: 'short' }).toUpperCase()
        : 'OCT'),
    year: raw.year || defaultYear,
    author: raw.author || 'Pak Veda',
    category: raw.category || 'Harvest & Extraction',
    tags: rawTags,
    takeaways: rawTakeaways,
    title: raw.title || '',
    excerpt: raw.excerpt || '',
    readTime: raw.readTime || '4 min read',
    image: resolveImageUrl(raw.image),
    alt: raw.alt || raw.title || '',
    content: Array.isArray(raw.content)
      ? raw.content
      : [String(raw.content || '')],
    comments: rawComments,
    isPopular: Boolean(raw.isPopular),
    isPublished: raw.isPublished ?? true,
    createdAt: raw.createdAt,
  };
}

export interface FetchProductsParams {
  section?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  flavour?: string;
  origin?: string;
  maxPrice?: number;
  minPrice?: number;
  search?: string;
  sort?: 'default' | 'popularity' | 'rating' | 'price-asc' | 'price-desc' | string;
  page?: number;
  limit?: number;
}

export interface FetchOptions {
  signal?: AbortSignal;
  forceFresh?: boolean;
  ttlMs?: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ProductFiltersResponse {
  categories: string[];
  subcategories?: { category: string; subcategory: string; count: number }[];
  brands: string[];
  flavours: { name: string; count: number }[];
  origins: { name: string; count: number }[];
  minPrice: number;
  maxPrice: number;
  priceRange?: { min: number; max: number };
}

export interface ReviewItem {
  id?: string;
  _id?: string;
  author: string;
  email?: string;
  city?: string;
  rating: number;
  comment: string;
  verifiedPurchase?: boolean;
  orderReference?: string;
  createdAt?: string;
  date?: string;
}

export interface ProductDetailResponse {
  product: Product;
  reviews: ReviewItem[];
  relatedProducts: Product[];
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  discountAmount: number;
  shippingFee: number;
  finalTotal: number;
  eligibleSubtotal?: number;
  dealItemsExcluded?: boolean;
  message: string;
}

export interface CreateOrderPayload {
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  shippingAddress: {
    city: string;
    area?: string;
    address: string;
    notes?: string;
  };
  items: {
    productId: string;
    quantity: number;
  }[];
  paymentMethod: 'Cash on Delivery' | 'PayFast (Sandbox)' | 'Bank Transfer (IBFT)';
  couponCode?: string;
}

export interface PayfastCheckoutInfo {
  payment_url: string;
  fields: Record<string, string>;
  orderReference: string;
  isSandbox: boolean;
}

export interface BankDetails {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  branch: string;
  instructions: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order: {
    orderReference: string;
    courierName: string;
    courierTrackingCode: string;
    total: number;
    subtotal: number;
    discountAmount: number;
    shippingFee: number;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    trackingStage: number;
    createdAt: string;
    items: any[];
  };
  payfast?: PayfastCheckoutInfo | null;
  bankDetails?: BankDetails | null;
}

export interface TrackingTimelineStep {
  stage: number;
  title: string;
  detail: string;
  completed: boolean;
}

export interface TrackOrderResponse {
  orderReference: string;
  courierName: string;
  courierTrackingCode: string;
  customerName: string;
  city: string;
  address: string;
  items: any[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  trackingStage: number;
  statusSummary: string;
  etaText?: string;
  estimatedDelivery: string;
  timeline: TrackingTimelineStep[];
  statusHistory: {
    stage: number;
    orderStatus: string;
    note: string;
    updatedBy: string;
    timestamp: string;
  }[];
  createdAt: string;
}

// ----------------------------------------------------------------------
// API Methods with Integrated Caching & Deduplication
// ----------------------------------------------------------------------

/**
 * GET /api/products
 */
export async function fetchProducts(
  params: FetchProductsParams = {},
  options?: FetchOptions
): Promise<ProductsResponse> {
  const qs = new URLSearchParams();
  if (params.section) qs.set('section', params.section);
  if (params.category && params.category !== 'All') qs.set('category', params.category);
  if (params.brand && params.brand !== 'All' && params.brand !== 'All Brands')
    qs.set('brand', params.brand);
  if (params.flavour && params.flavour !== 'All') qs.set('flavour', params.flavour);
  if (params.origin && params.origin !== 'All') qs.set('origin', params.origin);
  if (params.maxPrice) qs.set('maxPrice', String(params.maxPrice));
  if (params.minPrice) qs.set('minPrice', String(params.minPrice));
  if (params.search) qs.set('search', params.search);
  if (params.sort) qs.set('sort', params.sort);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  const queryStr = qs.toString();
  const url = `${API_BASE_URL}/products${queryStr ? `?${queryStr}` : ''}`;
  const cacheKey = `products:${queryStr}`;

  // For live search queries, cache briefly (10s) and support abort signal
  const isSearch = Boolean(params.search?.trim());
  const ttl = options?.ttlMs ?? (isSearch ? 10000 : 60000);

  return fetchCached(
    cacheKey,
    async () => {
      const res = await fetch(url, { signal: options?.signal });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `Failed to fetch products (${res.status})`);
      }
      const data = await res.json();
      return {
        products: Array.isArray(data.products)
          ? data.products.map(normalizeProduct)
          : [],
        total: data.total || 0,
        page: data.page || 1,
        totalPages: data.totalPages || 1,
      };
    },
    ttl,
    options?.forceFresh
  );
}

export interface HomeSectionsData {
  featuredGrid: Product[];
  bestSellers: Product[];
  uniqueProducts: Product[];
  shopProducts: Product[];
}

export async function fetchDeals(options?: {
  forceFresh?: boolean;
  ttlMs?: number;
}): Promise<any[]> {
  const url = `${API_BASE_URL}/deals`;
  return fetchCached(
    'store:active_deals',
    async () => {
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.deals) ? data.deals : [];
    },
    options?.ttlMs ?? 30000,
    options?.forceFresh
  );
}

/**
 * GET /api/home (returns aggregated section products in a single round-trip)
 */
export async function fetchHomeSections(options?: FetchOptions): Promise<HomeSectionsData> {
  const cacheKey = 'home_sections';
  return fetchCached(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE_URL}/home`, { signal: options?.signal });
      if (!res.ok) {
        throw new Error(`Failed to fetch home sections (${res.status})`);
      }
      const data = await res.json();
      return {
        featuredGrid: Array.isArray(data.featuredGrid) ? data.featuredGrid.map(normalizeProduct) : [],
        bestSellers: Array.isArray(data.bestSellersProducts)
          ? data.bestSellersProducts.map(normalizeProduct)
          : Array.isArray(data.bestSellers)
          ? data.bestSellers.map(normalizeProduct)
          : [],
        uniqueProducts: Array.isArray(data.uniqueProducts) ? data.uniqueProducts.map(normalizeProduct) : [],
        shopProducts: Array.isArray(data.shopProducts) ? data.shopProducts.map(normalizeProduct) : [],
      };
    },
    15000,
    options?.forceFresh
  );
}

/**
 * GET /api/products/filters
 */
export async function fetchProductFilters(options?: FetchOptions): Promise<ProductFiltersResponse> {
  const cacheKey = 'product_filters';
  return fetchCached(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE_URL}/products/filters`, { signal: options?.signal });
      if (!res.ok) {
        throw new Error('Failed to load product filters');
      }
      return await res.json();
    },
    300000,
    options?.forceFresh
  );
}

/**
 * GET /api/products/:idOrSlug
 */
export async function fetchProductById(
  idOrSlug: string,
  options?: FetchOptions
): Promise<ProductDetailResponse> {
  const cleanId = encodeURIComponent(idOrSlug.trim());
  const cacheKey = `product:${cleanId}`;

  return fetchCached(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE_URL}/products/${cleanId}`, { signal: options?.signal });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(
          errorBody.message || `Product not found (${res.status})`
        );
      }
      const data = await res.json();
      return {
        product: normalizeProduct(data.product),
        reviews: Array.isArray(data.reviews)
          ? data.reviews.map((r: any) => ({
              id: r._id || r.id,
              author: r.author,
              rating: r.rating,
              comment: r.comment,
              date: r.createdAt
                ? new Date(r.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recently',
              createdAt: r.createdAt,
            }))
          : [],
        relatedProducts: Array.isArray(data.relatedProducts)
          ? data.relatedProducts.map(normalizeProduct)
          : [],
      };
    },
    15000,
    options?.forceFresh
  );
}

/**
 * POST /api/products/:idOrSlug/reviews
 */
export async function submitProductReview(
  idOrSlug: string,
  payload: { author: string; email: string; rating: number; comment: string; city?: string }
): Promise<{
  success: boolean;
  message: string;
  review: ReviewItem;
  rating: number;
  reviewsCount: number;
}> {
  const cleanId = encodeURIComponent(idOrSlug.trim());
  const res = await fetch(
    `${API_BASE_URL}/products/${cleanId}/reviews`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to submit review');
  }

  // Purge product detail and catalog cache so updated review and count load immediately
  clearApiCache(`product:${cleanId}`);
  clearApiCache('products');

  return {
    success: true,
    message: data.message || 'Review submitted successfully',
    review: {
      id: data.review?._id || data.review?.id,
      author: data.review?.author || payload.author,
      email: data.review?.email || payload.email,
      rating: data.review?.rating || payload.rating,
      comment: data.review?.comment || payload.comment,
      verifiedPurchase: Boolean(data.review?.verifiedPurchase ?? true),
      orderReference: data.review?.orderReference,
      city: data.review?.city,
      date: 'Just now',
    },
    rating: data.rating,
    reviewsCount: data.reviewsCount,
  };
}

/**
 * POST /api/coupons/validate
 */
export async function validateCoupon(
  code: string,
  subtotal: number,
  items?: Array<{ productId: string; quantity: number; isDeal?: boolean; price?: number }>
): Promise<CouponValidationResult> {
  const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, subtotal, items }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Invalid coupon code');
  }
  return data;
}

/**
 * POST /api/orders (Guest checkout)
 */
export async function createOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to place order');
  }

  // Clear stock caches
  clearApiCache('products');
  clearApiCache('home_sections');

  return data;
}

/**
 * POST /api/payments/payfast/simulate-success/:orderReference
 * Sandbox helper to simulate instant PayFast payment settlement in development
 */
export async function simulatePayfastSuccess(orderReference: string): Promise<any> {
  const cleanRef = orderReference.trim().toUpperCase();
  const res = await fetch(
    `${API_BASE_URL}/payments/payfast/simulate-success/${encodeURIComponent(cleanRef)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Payment simulation failed');
  }
  return data;
}

/**
 * POST /api/payments/payfast/init
 * Re-fetches PayFast payload with signed fields for a pending order
 */
export async function initPayfast(orderReference: string): Promise<PayfastCheckoutInfo> {
  const cleanRef = orderReference.trim().toUpperCase();
  const res = await fetch(`${API_BASE_URL}/payments/payfast/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderReference: cleanRef,
      clientUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to initialize PayFast payment');
  }
  return data;
}

/**
 * PATCH /api/orders/:orderReference/payment-method
 * Allows customer to switch payment method (e.g. from cancelled PayFast to COD)
 */
export async function updateOrderPaymentMethod(
  orderReference: string,
  paymentMethod: 'Cash on Delivery' | 'PayFast (Sandbox)'
): Promise<any> {
  const cleanRef = orderReference.trim().toUpperCase();
  const res = await fetch(
    `${API_BASE_URL}/orders/${encodeURIComponent(cleanRef)}/payment-method`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update payment method');
  }
  return data;
}

/**
 * Helper to submit an invisible HTML form POST to PayFast's gateway URL
 */
export function submitPayfastRedirect(
  paymentUrl: string,
  fields: Record<string, string>
): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = paymentUrl;
  form.style.display = 'none';

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    }
  }

  document.body.appendChild(form);
  form.submit();
}

/**
 * GET /api/orders/track/:orderReference
 */
export async function trackOrder(
  orderReference: string,
  options?: FetchOptions
): Promise<TrackOrderResponse> {
  const cleanRef = orderReference.trim().toUpperCase();
  const res = await fetch(
    `${API_BASE_URL}/orders/track/${encodeURIComponent(cleanRef)}`,
    { signal: options?.signal }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Order "${cleanRef}" not found`);
  }
  return data;
}

/**
 * GET /api/blogs
 */
export async function fetchBlogs(options?: FetchOptions): Promise<BlogPost[]> {
  const cacheKey = 'blogs_list';
  return fetchCached(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE_URL}/blogs`, { signal: options?.signal });
      if (!res.ok) {
        throw new Error('Failed to load blog posts');
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.blogs || [];
      return list.map(normalizeBlogPost);
    },
    180000,
    options?.forceFresh
  );
}

/**
 * GET /api/blogs/:idOrSlug
 */
export async function fetchBlogById(
  idOrSlug: string,
  options?: FetchOptions
): Promise<BlogPost> {
  const cleanId = encodeURIComponent(idOrSlug.trim());
  const cacheKey = `blog:${cleanId}`;

  return fetchCached(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE_URL}/blogs/${cleanId}`, { signal: options?.signal });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Blog post not found`);
      }
      const post = data.blog || data;
      return normalizeBlogPost(post);
    },
    180000,
    options?.forceFresh
  );
}

/**
 * GET /api/blogs/:idOrSlug/comments
 * Fetches fresh reader notes / comments for a blog post
 */
export async function fetchBlogComments(
  idOrSlug: string,
  options?: FetchOptions
): Promise<BlogPost['comments']> {
  const cleanId = encodeURIComponent(idOrSlug.trim());
  const res = await fetch(`${API_BASE_URL}/blogs/${cleanId}/comments`, {
    signal: options?.signal,
  });
  if (!res.ok) return [];
  const data = await res.json();
  const list = data.comments || data.data || [];
  return list.map((c: any) => ({
    id: c._id ? String(c._id) : c.id || `c-${Date.now()}`,
    _id: c._id ? String(c._id) : undefined,
    author: c.author || 'Reader',
    city: c.city || 'Pakistan',
    comment: c.comment || '',
    createdAt: c.createdAt,
    date: c.createdAt
      ? new Date(c.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Recently',
  }));
}

/**
 * POST /api/blogs/:idOrSlug/comments
 * Submits a public reader note/comment to a blog post and invalidates cache
 */
export async function submitBlogComment(
  idOrSlug: string,
  payload: { author: string; city?: string; comment: string }
): Promise<{ success: boolean; message: string; comments: BlogPost['comments'] }> {
  const cleanId = encodeURIComponent(idOrSlug.trim());
  const res = await fetch(`${API_BASE_URL}/blogs/${cleanId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to submit comment');
  }

  // Invalidate in-memory caches
  clearApiCache('blog');
  clearApiCache('blogs_list');

  return {
    success: true,
    message: data.message || 'Comment submitted successfully',
    comments: (data.comments || []).map((c: any) => ({
      id: c._id ? String(c._id) : c.id || `c-${Date.now()}`,
      author: c.author || 'Reader',
      city: c.city || 'Pakistan',
      comment: c.comment || '',
      createdAt: c.createdAt,
      date: c.createdAt
        ? new Date(c.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'Today',
    })),
  };
}

/**
 * POST /api/contact
 */
export async function submitContactInquiry(payload: {
  name: string;
  contactInfo: string;
  city?: string;
  topic: string;
  message: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to submit inquiry');
  }
  return data;
}

/**
 * POST /api/newsletter
 */
export async function subscribeNewsletter(
  email: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to subscribe');
  }
  return data;
}

export interface SubcategoryItem {
  name: string;
  slug?: string;
  serialNumber?: string;
  count?: number;
  description?: string;
}

export interface CategoryItem {
  _id: string;
  categoryNumber?: number;
  name: string;
  slug?: string;
  department?: string;
  description?: string;
  count: number;
  img?: string;
  icon?: string;
  subcategories: SubcategoryItem[];
}

/**
 * GET /api/categories
 */
export async function fetchCategories(options?: FetchOptions): Promise<CategoryItem[]> {
  const cacheKey = 'categories_list';
  return fetchCached(
    cacheKey,
    async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/categories`, { signal: options?.signal });
        const data = await res.json();
        if (!res.ok) return [];
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    300000,
    options?.forceFresh
  );
}
