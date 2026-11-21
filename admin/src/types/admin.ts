export type AdminRole = 'super_admin' | 'hub_manager';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
}

export type BrandName =
  | 'Pak Veda'
  | 'Pak Veda Reserve'
  | 'Pak Veda Organics'
  | 'Pak Veda Botanicals'
  | 'Zaitoon Reserve'
  | 'Chakwal Press'
  | 'Himalayan Sidr'
  | 'Verdant Grove'
  | string;

export interface AdminProduct {
  _id: string;
  slug: string;
  sku: string;
  name: string;
  brand: BrandName;
  category: string;
  subcategory?: string;
  flavour?: string;
  origin?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  stock: number;
  soldCount: number;
  isSale: boolean;
  isNew: boolean;
  isActive: boolean;
  popularity: number;
  size: string;
  description: string;
  detailedDescription?: string;
  ingredients?: string;
  harvestDate?: string;
  storageInstructions?: string;
  image: string;
  galleryImages: string[];
  tag?: string;
  sections: string[];
  sectionOrder?: Record<string, number>;
  extractionMethod?: string;
  acidityLevel?: string;
  isOrganic?: boolean;
  inStock?: boolean;
}

export type DiscountType = 'percentage' | 'flat';

export interface AdminCoupon {
  _id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
}

export type OrderStatus =
  | 'confirmed'
  | 'cold_packed'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'Cash on Delivery' | 'Bank Transfer (IBFT)';

export type PaymentStatus = 'pending_cod' | 'awaiting_ibft' | 'paid' | 'refunded';

export interface OrderItem {
  product: string;
  slug: string;
  name: string;
  size: string;
  image: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderStatusHistoryEntry {
  stage: number;
  orderStatus: OrderStatus;
  note?: string;
  updatedBy?: string;
  timestamp: string;
}

export interface AdminOrder {
  _id: string;
  orderReference: string;
  courierName: string;
  courierTrackingCode?: string;
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
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  ibftReference?: string;
  couponCode?: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  orderStatus: OrderStatus;
  trackingStage: number;
  statusSummary: string;
  estimatedDelivery: string;
  statusHistory: OrderStatusHistoryEntry[];
  cancelReason?: string;
  createdAt: string;
}

export interface AdminBlogComment {
  _id?: string;
  id?: string;
  author: string;
  city?: string;
  comment: string;
  createdAt?: string;
}

export interface AdminBlogPost {
  _id: string;
  slug: string;
  day: string;
  month: string;
  year?: string;
  author?: string;
  category?: string;
  tags?: string[];
  takeaways?: string[];
  title: string;
  excerpt: string;
  readTime: string;
  image: string;
  alt: string;
  content: string[];
  comments?: AdminBlogComment[];
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminReview {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug?: string;
  } | string;
  author: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export type InquiryStatus = 'new' | 'in_progress' | 'resolved';

export type InquiryTopic =
  | 'Order & Cash on Delivery'
  | 'Product Harvest & Lab Purity'
  | 'Bulk & Corporate Gifting'
  | 'Orchard & Wholesale Partnership';

export interface AdminInquiry {
  _id: string;
  name: string;
  contactInfo: string;
  city: string;
  topic: InquiryTopic | string;
  message: string;
  status: InquiryStatus;
  adminNote?: string;
  createdAt: string;
}

export interface NewsletterSubscriber {
  _id: string;
  email: string;
  source: string;
  isActive: boolean;
  subscribedAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  todayOrdersCount: number;
  totalOrdersCount: number;
  pendingDispatchCount: number;
  paymentBreakdown: Array<{
    _id?: string;
    paymentMethod?: string;
    count: number;
    total: number;
  }> | Record<string, { count: number; total: number }>;
  ordersByStatus: Array<{
    _id?: string;
    status?: string;
    count: number;
  }> | Record<string, number>;
  ordersByCity: Array<{
    _id?: string;
    city?: string;
    count: number;
    revenue?: number;
  }>;
  lowStockProducts: AdminProduct[];
  topSellingProducts: AdminProduct[];
  recentOrders: AdminOrder[];
  unreadInquiriesCount: number;
  activeCouponsCount: number;
  newsletterSubscribersCount: number;
}

export type HomepageSectionKey = 'featured-grid' | 'best-sellers' | 'unique' | 'shop';

export interface SectionOrderItem {
  productId: string;
  order: number;
}

export interface AdminSectionsResponse {
  success: boolean;
  sections: {
    'featured-grid': AdminProduct[];
    'best-sellers': AdminProduct[];
    unique: AdminProduct[];
    shop: AdminProduct[];
  };
  products: AdminProduct[];
}
