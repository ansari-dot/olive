import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import ContactInquiry from "../models/ContactInquiry.js";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";

export async function getDashboardStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    revenueAgg,
    totalOrdersCount,
    todayOrdersCount,
    pendingDispatchCount,
    paymentBreakdownAgg,
    ordersByStatusAgg,
    ordersByCityAgg,
    lowStockProducts,
    topSellingProducts,
    recentOrders,
    unreadInquiriesCount,
    activeCouponsCount,
    newsletterSubscribersCount,
  ] = await Promise.all([
    // 1. Total revenue for non-cancelled orders
    Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
    ]),
    // 2. Total orders count
    Order.countDocuments(),
    // 3. Today orders count
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    // 4. Pending dispatch (stages 1 & 2)
    Order.countDocuments({
      trackingStage: { $in: [1, 2] },
      orderStatus: { $ne: "cancelled" },
    }),
    // 5. Payment breakdown (COD vs IBFT)
    Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$total" },
        },
      },
    ]),
    // 6. Orders by status
    Order.aggregate([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]),
    // 7. Orders by top cities
    Order.aggregate([
      {
        $group: {
          _id: "$shippingAddress.city",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { city: "$_id", count: 1, revenue: "$totalRevenue", totalRevenue: 1, _id: 0 } },
    ]),
    // 8. Low stock products (stock <= 5)
    Product.find({ stock: { $lte: 5 } })
      .select("name sku brand size stock price")
      .limit(10)
      .lean(),
    // 9. Top selling products
    Product.find({ isActive: true })
      .sort({ soldCount: -1 })
      .select("name sku brand size price soldCount stock image")
      .limit(5)
      .lean(),
    // 10. Recent 10 orders
    Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "orderReference customer.name shippingAddress.city total paymentMethod orderStatus trackingStage createdAt"
      )
      .lean(),
    // 11. Unread inquiries
    ContactInquiry.countDocuments({ status: "new" }),
    // 12. Active coupons
    Coupon.countDocuments({ isActive: true }),
    // 13. Newsletter subscribers
    NewsletterSubscriber.countDocuments({ isActive: true }),
  ]);

  const ordersByStatus = {
    confirmed: 0,
    cold_packed: 0,
    dispatched: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  };
  ordersByStatusAgg.forEach((item) => {
    if (ordersByStatus.hasOwnProperty(item._id)) {
      ordersByStatus[item._id] = item.count;
    }
  });

  const paymentBreakdown = {
    cod: { count: 0, total: 0, totalAmount: 0 },
    ibft: { count: 0, total: 0, totalAmount: 0 },
  };
  paymentBreakdownAgg.forEach((item) => {
    if (item._id === "Cash on Delivery") {
      paymentBreakdown.cod = {
        count: item.count,
        total: item.totalAmount,
        totalAmount: item.totalAmount,
      };
    } else if (item._id === "Bank Transfer (IBFT)") {
      paymentBreakdown.ibft = {
        count: item.count,
        total: item.totalAmount,
        totalAmount: item.totalAmount,
      };
    }
  });

  return {
    totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    todayOrdersCount,
    totalOrdersCount,
    pendingDispatchCount,
    paymentBreakdown,
    ordersByStatus,
    ordersByCity: ordersByCityAgg,
    lowStockProducts,
    topSellingProducts,
    recentOrders,
    unreadInquiriesCount,
    activeCouponsCount,
    newsletterSubscribersCount,
  };
}
