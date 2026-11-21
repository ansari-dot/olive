import type {
  AdminBlogComment,
  AdminBlogPost,
  AdminCoupon,
  AdminDeal,
  CreateDealPayload,
  UpdateDealPayload,
  AdminInquiry,
  AdminOrder,
  AdminProduct,
  AdminReview,
  AdminSectionsResponse,
  AdminUser,
  DashboardStats,
  InquiryStatus,
  NewsletterSubscriber,
  OrderStatus,
  PaymentStatus,
} from '../types/admin';

const TOKEN_STORAGE_KEY = 'zaitoon_admin_token';

export const getApiBaseUrl = (): string => {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (configured || 'http://localhost:5000/api').replace(/\/+$/, '');
};

export const getMediaBaseUrl = (): string => {
  return getApiBaseUrl().replace(/\/api$/, '');
};

export const DEFAULT_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='96' viewBox='0 0 80 96' fill='none'><rect width='80' height='96' fill='%23FAF8F5'/><path d='M40 26c-11 15-18 27-18 38 0 10 8 18 18 18s18-8 18-18c0-11-7-23-18-38z' fill='%23224D26' fill-opacity='0.18'/><circle cx='40' cy='62' r='6' fill='%23224D26' fill-opacity='0.3'/><path d='M40 26c-2-8 3-14 8-16-1 5 1 11-8 16z' fill='%23224D26' fill-opacity='0.35'/></svg>";

export const resolveAssetUrl = (url?: string): string => {
  if (!url || typeof url !== 'string' || !url.trim()) return DEFAULT_IMAGE_PLACEHOLDER;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads') || trimmed.startsWith('/assets')) {
    return `${getMediaBaseUrl()}${trimmed}`;
  }
  return `${getMediaBaseUrl()}/${trimmed.replace(/^\/+/, '')}`;
};

export const resolveMediaUrl = resolveAssetUrl;

export const getStoredToken = (): string | null => {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string | null): void => {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const text = await response.text();
  let json: Record<string, unknown> = {};
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = { message: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      setStoredToken(null);
    }
    const errMsg =
      (typeof json.message === 'string' && json.message) ||
      (typeof json.error === 'string' && json.error) ||
      `Request failed (${response.status})`;
    throw new ApiError(errMsg, response.status);
  }

  return json as T;
}

const unwrapList = <T>(res: unknown, keys: string[]): T[] => {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>;
    for (const k of [...keys, 'data', 'items', 'results']) {
      if (Array.isArray(obj[k])) return obj[k] as T[];
    }
  }
  return [];
};

const unwrapOne = <T>(res: unknown, keys: string[]): T => {
  if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>;
    for (const k of [...keys, 'data']) {
      if (obj[k] && typeof obj[k] === 'object') return obj[k] as T;
    }
  }
  return res as T;
};

// Auth
export async function loginAdmin(
  email: string,
  password: string
): Promise<{ token: string; admin: AdminUser }> {
  const res = await request<Record<string, unknown>>('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = (res.data as Record<string, unknown> | undefined) ?? res;
  const token = (data.token as string) || (res.token as string) || '';
  const admin = (data.admin as AdminUser) || (data.user as AdminUser) || (res.admin as AdminUser);
  if (token) setStoredToken(token);
  return { token, admin };
}

export async function fetchCurrentAdmin(): Promise<AdminUser> {
  const res = await request<unknown>('/admin/auth/me');
  return unwrapOne<AdminUser>(res, ['admin', 'user']);
}

export function logoutAdmin(): void {
  setStoredToken(null);
}

// Dashboard
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await request<unknown>('/admin/dashboard/stats');
  return unwrapOne<DashboardStats>(res, ['stats']);
}

// Products
export async function fetchAdminProducts(params?: {
  search?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  section?: string;
}): Promise<AdminProduct[]> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.category && params.category !== 'All') qs.set('category', params.category);
  if (params?.subcategory && params.subcategory !== 'All') qs.set('subcategory', params.subcategory);
  if (params?.brand && params.brand !== 'All') qs.set('brand', params.brand);
  if (params?.section && params.section !== 'All') qs.set('section', params.section);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const res = await request<unknown>(`/admin/products${query}`);
  return unwrapList<AdminProduct>(res, ['products']);
}

export async function fetchAdminCategories(): Promise<any[]> {
  try {
    const res = await request<unknown>('/categories');
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function createAdminCategory(payload: any): Promise<any> {
  return request<any>('/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminCategory(id: string, payload: any): Promise<any> {
  return request<any>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminCategory(id: string): Promise<void> {
  await request<any>(`/categories/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchAdminOrigins(): Promise<any[]> {
  try {
    const res: any = await request<unknown>('/origins');
    return res?.origins || res?.data || (Array.isArray(res) ? res : []);
  } catch {
    return [];
  }
}

export async function createAdminOrigin(payload: any): Promise<any> {
  const res: any = await request<any>('/origins', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res?.origin || res?.data || res;
}

export async function updateAdminOrigin(id: string, payload: any): Promise<any> {
  const res: any = await request<any>(`/origins/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res?.origin || res?.data || res;
}

export async function deleteAdminOrigin(id: string): Promise<void> {
  await request<any>(`/origins/${id}`, {
    method: 'DELETE',
  });
}

export async function createAdminProduct(
  payload: Partial<AdminProduct>
): Promise<AdminProduct> {
  const res = await request<unknown>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return unwrapOne<AdminProduct>(res, ['product']);
}

export async function updateAdminProduct(
  id: string,
  payload: Partial<AdminProduct>
): Promise<AdminProduct> {
  const res = await request<unknown>(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return unwrapOne<AdminProduct>(res, ['product']);
}

export async function updateProductStock(
  id: string,
  stock: number
): Promise<AdminProduct> {
  const res = await request<unknown>(`/admin/products/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stock }),
  });
  return unwrapOne<AdminProduct>(res, ['product']);
}

export async function deleteAdminProduct(id: string): Promise<void> {
  await request<unknown>(`/admin/products/${id}`, { method: 'DELETE' });
}

export async function uploadAdminImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await request<Record<string, unknown>>('/admin/upload', {
    method: 'POST',
    body: formData,
  });
  const data = (res.data as Record<string, unknown> | undefined) ?? res;
  const url =
    (data.url as string) ||
    (data.imageUrl as string) ||
    (data.secure_url as string) ||
    (res.url as string) ||
    '';
  if (!url) throw new Error('Upload completed without returning an image URL');
  return url;
}

// Homepage Sections Merchandising
export async function fetchAdminSections(): Promise<AdminSectionsResponse> {
  return await request<AdminSectionsResponse>('/admin/sections');
}

export async function updateAdminSectionLayout(
  sectionKey: string,
  items: Array<{ productId: string; order: number }>
): Promise<{ success: boolean; sectionKey: string; items: AdminProduct[] }> {
  const safeKey = encodeURIComponent(sectionKey.trim());
  return await request<{ success: boolean; sectionKey: string; items: AdminProduct[] }>(
    `/admin/sections/${safeKey}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    }
  );
}

// Coupons
export async function fetchAdminCoupons(): Promise<AdminCoupon[]> {
  const res = await request<unknown>('/admin/coupons');
  return unwrapList<AdminCoupon>(res, ['coupons']);
}

export async function createAdminCoupon(
  payload: Partial<AdminCoupon>
): Promise<AdminCoupon> {
  const res = await request<unknown>('/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return unwrapOne<AdminCoupon>(res, ['coupon']);
}

export async function updateAdminCoupon(
  id: string,
  payload: Partial<AdminCoupon>
): Promise<AdminCoupon> {
  const res = await request<unknown>(`/admin/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return unwrapOne<AdminCoupon>(res, ['coupon']);
}

export async function toggleAdminCoupon(id: string): Promise<AdminCoupon> {
  const res = await request<unknown>(`/admin/coupons/${id}/toggle`, {
    method: 'PATCH',
  });
  return unwrapOne<AdminCoupon>(res, ['coupon']);
}

export async function deleteAdminCoupon(id: string): Promise<void> {
  await request<unknown>(`/admin/coupons/${id}`, { method: 'DELETE' });
}

// Flash Deals & Sales
export async function fetchAdminDeals(params?: {
  productId?: string;
  isActive?: boolean;
}): Promise<AdminDeal[]> {
  const qs = new URLSearchParams();
  if (params?.productId) qs.set('productId', params.productId);
  if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive));
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const res = await request<unknown>(`/admin/deals${query}`);
  return unwrapList<AdminDeal>(res, ['deals']);
}

export async function createAdminDeal(payload: CreateDealPayload): Promise<AdminDeal> {
  const res = await request<unknown>('/admin/deals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return unwrapOne<AdminDeal>(res, ['deal']);
}

export async function updateAdminDeal(
  id: string,
  payload: UpdateDealPayload
): Promise<AdminDeal> {
  const res = await request<unknown>(`/admin/deals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return unwrapOne<AdminDeal>(res, ['deal']);
}

export async function toggleAdminDeal(id: string, isActive: boolean): Promise<AdminDeal> {
  const res = await request<unknown>(`/admin/deals/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  return unwrapOne<AdminDeal>(res, ['deal']);
}

export async function deleteAdminDeal(id: string): Promise<void> {
  await request<unknown>(`/admin/deals/${id}`, { method: 'DELETE' });
}

// Orders
export async function fetchAdminOrders(params?: {
  orderStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  courierProvider?: string;
  shipmentStatus?: string;
}): Promise<{ orders: AdminOrder[]; total: number; page: number; totalPages: number }> {
  const qs = new URLSearchParams();
  if (params?.orderStatus && params.orderStatus !== 'all') {
    qs.set('orderStatus', params.orderStatus);
  }
  if (params?.paymentMethod && params.paymentMethod !== 'all') {
    qs.set('paymentMethod', params.paymentMethod);
  }
  if (params?.paymentStatus && params.paymentStatus !== 'all') {
    qs.set('paymentStatus', params.paymentStatus);
  }
  if (params?.city && params.city !== 'all') {
    qs.set('city', params.city);
  }
  if (params?.courierProvider && params.courierProvider !== 'all') {
    qs.set('courierProvider', params.courierProvider);
  }
  if (params?.shipmentStatus && params.shipmentStatus !== 'all') {
    qs.set('shipmentStatus', params.shipmentStatus);
  }
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));

  const query = qs.toString() ? `?${qs.toString()}` : '';
  const res = await request<Record<string, unknown>>(`/admin/orders${query}`);
  const orders = unwrapList<AdminOrder>(res, ['orders']);
  const total = typeof res.total === 'number' ? res.total : orders.length;
  const page = typeof res.page === 'number' ? res.page : 1;
  const totalPages = typeof res.totalPages === 'number' ? res.totalPages : 1;
  return { orders, total, page, totalPages };
}

export async function fetchAdminOrderDetail(orderReference: string): Promise<AdminOrder> {
  const res = await request<unknown>(`/admin/orders/${encodeURIComponent(orderReference)}`);
  return unwrapOne<AdminOrder>(res, ['order']);
}

export async function initiateCourierShipment(
  orderReference: string,
  payload: {
    provider: string;
    parcelWeightKg: number;
    remarks?: string;
  }
): Promise<AdminOrder> {
  const res = await request<unknown>(
    `/admin/orders/${encodeURIComponent(orderReference)}/shipment`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return unwrapOne<AdminOrder>(res, ['order']);
}

export async function syncAdminOrderTracking(
  orderReference: string
): Promise<{ order: AdminOrder; trackResult: any }> {
  const res = await request<any>(
    `/admin/orders/${encodeURIComponent(orderReference)}/sync-tracking`,
    {
      method: 'POST',
    }
  );
  return {
    order: unwrapOne<AdminOrder>(res, ['order']),
    trackResult: res.trackResult,
  };
}

export async function processAdminOrderReturn(
  orderReference: string,
  payload: {
    action: 'request' | 'inspect' | 'approve_and_restock' | 'reject';
    reason?: string;
    inspectionNotes?: string;
    restockQuantity?: number;
  }
): Promise<AdminOrder> {
  const res = await request<unknown>(
    `/admin/orders/${encodeURIComponent(orderReference)}/return`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return unwrapOne<AdminOrder>(res, ['order']);
}

export async function updateAdminOrderStatus(
  orderReference: string,
  payload: { orderStatus: OrderStatus; note?: string }
): Promise<AdminOrder> {
  const res = await request<unknown>(
    `/admin/orders/${encodeURIComponent(orderReference)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
  return unwrapOne<AdminOrder>(res, ['order']);
}

export async function updateAdminOrderTracking(
  orderReference: string,
  payload: {
    courierName?: string;
    courierTrackingCode?: string;
    estimatedDelivery?: string;
  }
): Promise<AdminOrder> {
  const res = await request<unknown>(
    `/admin/orders/${encodeURIComponent(orderReference)}/tracking`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
  return unwrapOne<AdminOrder>(res, ['order']);
}

export async function updateAdminOrderPayment(
  orderReference: string,
  payload: { paymentStatus: PaymentStatus; ibftReference?: string }
): Promise<AdminOrder> {
  const res = await request<unknown>(
    `/admin/orders/${encodeURIComponent(orderReference)}/payment`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
  return unwrapOne<AdminOrder>(res, ['order']);
}

export async function cancelAdminOrder(
  orderReference: string,
  cancelReason: string
): Promise<AdminOrder> {
  const res = await request<unknown>(
    `/admin/orders/${encodeURIComponent(orderReference)}/cancel`,
    {
      method: 'PATCH',
      body: JSON.stringify({ cancelReason }),
    }
  );
  return unwrapOne<AdminOrder>(res, ['order']);
}

export async function deleteAllAdminOrders(): Promise<{
  success: boolean;
  message: string;
  deletedCount: number;
}> {
  const res = await request<any>('/admin/orders/all', {
    method: 'DELETE',
  });
  return res;
}

export async function deleteAdminOrder(orderReference: string): Promise<any> {
  const res = await request<any>(`/admin/orders/${encodeURIComponent(orderReference)}`, {
    method: 'DELETE',
  });
  return res;
}

// Blogs
export async function fetchAdminBlogs(): Promise<AdminBlogPost[]> {
  const res = await request<unknown>('/admin/blogs');
  return unwrapList<AdminBlogPost>(res, ['blogs', 'posts']);
}

export async function createAdminBlog(
  payload: Partial<AdminBlogPost>
): Promise<AdminBlogPost> {
  const res = await request<unknown>('/admin/blogs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return unwrapOne<AdminBlogPost>(res, ['blog', 'post']);
}

export async function updateAdminBlog(
  id: string,
  payload: Partial<AdminBlogPost>
): Promise<AdminBlogPost> {
  const res = await request<unknown>(`/admin/blogs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return unwrapOne<AdminBlogPost>(res, ['blog', 'post']);
}

export async function deleteAdminBlog(id: string): Promise<void> {
  await request<unknown>(`/admin/blogs/${id}`, { method: 'DELETE' });
}

export async function deleteAdminBlogComment(
  blogId: string,
  commentId: string
): Promise<AdminBlogComment[]> {
  const res = await request<{ success: boolean; comments: AdminBlogComment[] }>(
    `/admin/blogs/${blogId}/comments/${commentId}`,
    { method: 'DELETE' }
  );
  return res.comments || [];
}

// Reviews
export async function fetchAdminReviews(): Promise<AdminReview[]> {
  const res = await request<unknown>('/admin/reviews');
  return unwrapList<AdminReview>(res, ['reviews']);
}

export async function moderateAdminReview(
  id: string,
  isApproved: boolean
): Promise<AdminReview> {
  const res = await request<unknown>(`/admin/reviews/${id}/moderate`, {
    method: 'PATCH',
    body: JSON.stringify({ isApproved }),
  });
  return unwrapOne<AdminReview>(res, ['review']);
}

export async function deleteAdminReview(id: string): Promise<void> {
  await request<unknown>(`/admin/reviews/${id}`, { method: 'DELETE' });
}

// Contact Inquiries
export async function fetchAdminInquiries(): Promise<AdminInquiry[]> {
  const res = await request<unknown>('/admin/inquiries');
  return unwrapList<AdminInquiry>(res, ['inquiries']);
}

export async function updateAdminInquiry(
  id: string,
  payload: { status: InquiryStatus; adminNote?: string }
): Promise<AdminInquiry> {
  const res = await request<unknown>(`/admin/inquiries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return unwrapOne<AdminInquiry>(res, ['inquiry']);
}

// Newsletter
export async function fetchAdminNewsletter(): Promise<NewsletterSubscriber[]> {
  const res = await request<unknown>('/admin/newsletter');
  return unwrapList<NewsletterSubscriber>(res, ['subscribers']);
}

export async function downloadNewsletterCsv(): Promise<void> {
  const token = getStoredToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${getApiBaseUrl()}/admin/newsletter/export`, {
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zaitoon-newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
