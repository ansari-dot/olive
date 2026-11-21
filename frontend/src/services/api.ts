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
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  if (url.startsWith('/uploads/')) {
    return `${BACKEND_ORIGIN}${url}`;
  }
  return url;
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
    popularity: raw.popularity !== undefined ? Number(raw.popularity) : 80,
    size: raw.size || '',
    description: raw.description || '',
    image: resolveImageUrl(raw.image),
    galleryImages: Array.isArray(raw.galleryImages)
      ? raw.galleryImages.map(resolveImageUrl)
      : [],
    tag: raw.tag || undefined,
    extractionMethod: raw.extractionMethod || undefined,
    acidityLevel: raw.acidityLevel || undefined,
  };
}

/**
 * Normalizes backend BlogPost document to match frontend BlogPost interface
 */
export function normalizeBlogPost(raw: any): BlogPost {
  const id = raw.slug || (raw._id ? String(raw._id) : raw.id);
  return {
    id,
    slug: raw.slug || id,
    day: raw.day || '',
    month: raw.month || '',
    title: raw.title || '',
    excerpt: raw.excerpt || '',
    readTime: raw.readTime || '4 min read',
    image: resolveImageUrl(raw.image),
    alt: raw.alt || raw.title || '',
    content: Array.isArray(raw.content)
      ? raw.content
      : [String(raw.content || '')],
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
  city?: string;
  rating: number;
  comment: string;
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
  paymentMethod: 'Cash on Delivery' | 'Bank Transfer (IBFT)';
  couponCode?: string;
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
    120000,
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
    60000,
    options?.forceFresh
  );
}

/**
 * POST /api/products/:idOrSlug/reviews
 */
export async function submitProductReview(
  idOrSlug: string,
  payload: { author: string; rating: number; comment: string }
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

  // Purge product detail cache so updated review and count load immediately
  clearApiCache(`product:${cleanId}`);

  return {
    success: true,
    message: data.message || 'Review submitted successfully',
    review: {
      id: data.review?._id || data.review?.id,
      author: data.review?.author || payload.author,
      rating: data.review?.rating || payload.rating,
      comment: data.review?.comment || payload.comment,
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
  subtotal: number
): Promise<CouponValidationResult> {
  const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, subtotal }),
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
