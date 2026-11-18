import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { fetchDashboardStats, updateProductStock } from '../services/adminApi';
import type { AdminProduct, DashboardStats } from '../types/admin';
import { ORDER_STATUS_META, formatDateTime, formatPKR } from '../utils/formatters';

interface DashboardViewProps {
  onOpenOrder: (orderReference: string) => void;
  onNavigateTab: (tab: 'orders' | 'products' | 'coupons' | 'inquiries' | 'newsletter') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenOrder,
  onNavigateTab,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restockingId, setRestockingId] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  const handleQuickRestock = async (product: AdminProduct, addUnits = 15) => {
    setRestockingId(product._id);
    try {
      await updateProductStock(product._id, (product.stock ?? 0) + addUnits);
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock.');
    } finally {
      setRestockingId(null);
    }
  };

  const normalizedPayments = React.useMemo(() => {
    if (!stats?.paymentBreakdown) return [];
    if (Array.isArray(stats.paymentBreakdown)) {
      return stats.paymentBreakdown.map((item) => ({
        method: item.paymentMethod || item._id || 'Unknown',
        count: item.count ?? 0,
        total: item.total ?? 0,
      }));
    }
    return Object.entries(stats.paymentBreakdown).map(([method, val]) => ({
      method,
      count: val?.count ?? 0,
      total: val?.total ?? 0,
    }));
  }, [stats]);

  const normalizedStatuses = React.useMemo(() => {
    if (!stats?.ordersByStatus) return [];
    if (Array.isArray(stats.ordersByStatus)) {
      return stats.ordersByStatus.map((item) => ({
        status: (item.status || item._id || 'confirmed') as keyof typeof ORDER_STATUS_META,
        count: item.count ?? 0,
      }));
    }
    return Object.entries(stats.ordersByStatus).map(([status, count]) => ({
      status: status as keyof typeof ORDER_STATUS_META,
      count: Number(count ?? 0),
    }));
  }, [stats]);

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="h-[104px] bg-white border border-[#E2E8F0] animate-pulse p-5" />
          ))}
        </div>
        <div className="h-[300px] bg-white border border-[#E2E8F0] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-[#0F172A]">
            Orchard Operations Overview
          </h2>
          <p className="text-[13px] text-[#64748B]">
            Live revenue, nationwide COD &amp; IBFT dispatch status, and harvest stock alerts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadStats()}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-[#CBD5E1] bg-white hover:border-[#0F172A] px-3.5 py-2 text-[12px] font-medium text-[#0F172A] cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {error && (
        <div className="border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E2E8F0] p-5">
              <p className="text-[11.5px] uppercase tracking-[0.07em] font-semibold text-[#64748B]">
                Total Revenue (Non-Cancelled)
              </p>
              <p className="mt-2 text-[24px] font-semibold text-[#0F172A] font-mono-data">
                {formatPKR(stats.totalRevenue)}
              </p>
              <p className="mt-1 text-[12px] text-[#475569] font-mono-data">
                {stats.totalOrdersCount} total orders · {stats.todayOrdersCount} today
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-left bg-white border border-[#E2E8F0] hover:border-[#15472B] p-5 transition-colors cursor-pointer"
            >
              <p className="text-[11.5px] uppercase tracking-[0.07em] font-semibold text-[#64748B]">
                Pending Dispatch (Stage 1–2)
              </p>
              <p className="mt-2 text-[24px] font-semibold text-[#D97706] font-mono-data">
                {stats.pendingDispatchCount}
              </p>
              <p className="mt-1 text-[12px] text-[#15472B] inline-flex items-center gap-1">
                <span>Open dispatch queue</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('coupons')}
              className="text-left bg-white border border-[#E2E8F0] hover:border-[#15472B] p-5 transition-colors cursor-pointer"
            >
              <p className="text-[11.5px] uppercase tracking-[0.07em] font-semibold text-[#64748B]">
                Active Harvest Coupons
              </p>
              <p className="mt-2 text-[24px] font-semibold text-[#15472B] font-mono-data">
                {stats.activeCouponsCount}
              </p>
              <p className="mt-1 text-[12px] text-[#475569] font-mono-data">
                {stats.newsletterSubscribersCount} newsletter subscribers
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('inquiries')}
              className="text-left bg-white border border-[#E2E8F0] hover:border-[#15472B] p-5 transition-colors cursor-pointer"
            >
              <p className="text-[11.5px] uppercase tracking-[0.07em] font-semibold text-[#64748B]">
                Unread Care Inquiries
              </p>
              <p className="mt-2 text-[24px] font-semibold text-[#C46B3B] font-mono-data">
                {stats.unreadInquiriesCount}
              </p>
              <p className="mt-1 text-[12px] text-[#475569]">
                Islamabad Orchard Care Desk
              </p>
            </button>
          </div>

          {/* 3-Column Breakdown Tables: Payment Split, Order Stages, Top Pakistan Cities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Payment Breakdown */}
            <section className="bg-white border border-[#E2E8F0] p-5">
              <h3 className="text-[14px] font-semibold text-[#0F172A] pb-3 border-b border-[#F1F5F9]">
                Payment Method Split
              </h3>
              {normalizedPayments.length === 0 ? (
                <p className="py-6 text-[13px] text-[#64748B]">No payment data yet.</p>
              ) : (
                <table className="w-full text-[13px] mt-2">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] border-b border-[#F1F5F9]">
                      <th className="py-2 text-left font-medium">Method</th>
                      <th className="py-2 text-right font-medium">Orders</th>
                      <th className="py-2 text-right font-medium">Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {normalizedPayments.map((row) => (
                      <tr key={row.method} className="h-[38px]">
                        <td className="text-[#0F172A] font-medium">{row.method}</td>
                        <td className="text-right font-mono-data text-[#475569]">{row.count}</td>
                        <td className="text-right font-mono-data text-[#0F172A]">
                          {formatPKR(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Orders by Status */}
            <section className="bg-white border border-[#E2E8F0] p-5">
              <h3 className="text-[14px] font-semibold text-[#0F172A] pb-3 border-b border-[#F1F5F9]">
                Orders by Dispatch Stage
              </h3>
              {normalizedStatuses.length === 0 ? (
                <p className="py-6 text-[13px] text-[#64748B]">No orders recorded yet.</p>
              ) : (
                <table className="w-full text-[13px] mt-2">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] border-b border-[#F1F5F9]">
                      <th className="py-2 text-left font-medium">Stage</th>
                      <th className="py-2 text-right font-medium">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {normalizedStatuses.map((row) => {
                      const meta = ORDER_STATUS_META[row.status] ?? {
                        label: row.status,
                        colorClass: 'text-[#334155]',
                      };
                      return (
                        <tr key={row.status} className="h-[38px]">
                          <td className={`font-medium ${meta.colorClass}`}>{meta.label}</td>
                          <td className="text-right font-mono-data text-[#0F172A]">{row.count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>

            {/* Top Cities */}
            <section className="bg-white border border-[#E2E8F0] p-5">
              <h3 className="text-[14px] font-semibold text-[#0F172A] pb-3 border-b border-[#F1F5F9]">
                Top Pakistan Delivery Cities
              </h3>
              {(stats.ordersByCity ?? []).length === 0 ? (
                <p className="py-6 text-[13px] text-[#64748B]">No city data yet.</p>
              ) : (
                <table className="w-full text-[13px] mt-2">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] border-b border-[#F1F5F9]">
                      <th className="py-2 text-left font-medium">City</th>
                      <th className="py-2 text-right font-medium">Orders</th>
                      <th className="py-2 text-right font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {stats.ordersByCity.slice(0, 6).map((row, idx) => {
                      const cityName = row.city || row._id || 'Unknown';
                      return (
                        <tr key={`${cityName}-${idx}`} className="h-[38px]">
                          <td className="text-[#0F172A]">{cityName}</td>
                          <td className="text-right font-mono-data text-[#475569]">{row.count}</td>
                          <td className="text-right font-mono-data text-[#0F172A]">
                            {row.revenue !== undefined ? formatPKR(row.revenue) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>
          </div>

          {/* Low Stock Alerts & Top Selling */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section className="bg-white border border-[#E2E8F0] p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <h3 className="text-[14px] font-semibold text-[#0F172A] inline-flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  <span>Low Stock Alerts (&le; 5 units)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateTab('products')}
                  className="text-[12px] text-[#15472B] hover:underline cursor-pointer"
                >
                  All Inventory
                </button>
              </div>
              {(stats.lowStockProducts ?? []).length === 0 ? (
                <p className="py-6 text-[13px] text-[#16A34A]">
                  All orchard products are well stocked above 5 units.
                </p>
              ) : (
                <table className="w-full text-[13px] mt-2">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] border-b border-[#F1F5F9]">
                      <th className="py-2 text-left font-medium">Product</th>
                      <th className="py-2 text-right font-medium">Stock</th>
                      <th className="py-2 text-right font-medium">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {stats.lowStockProducts.map((prod) => (
                      <tr key={prod._id} className="h-[42px]">
                        <td className="pr-3">
                          <p className="font-medium text-[#0F172A] truncate max-w-[230px]">
                            {prod.name}
                          </p>
                          <p className="text-[11px] text-[#64748B] font-mono-data">{prod.sku}</p>
                        </td>
                        <td className="text-right font-mono-data font-semibold text-[#DC2626]">
                          {prod.stock}
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            disabled={restockingId === prod._id}
                            onClick={() => void handleQuickRestock(prod, 15)}
                            className="border border-[#CBD5E1] hover:border-[#15472B] px-2.5 py-1 text-[11px] font-medium text-[#0F172A] cursor-pointer"
                          >
                            {restockingId === prod._id ? 'Saving...' : '+15 Units'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="bg-white border border-[#E2E8F0] p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <h3 className="text-[14px] font-semibold text-[#0F172A]">
                  Top Selling Harvest Items
                </h3>
                <span className="text-[11.5px] text-[#64748B]">By units sold</span>
              </div>
              {(stats.topSellingProducts ?? []).length === 0 ? (
                <p className="py-6 text-[13px] text-[#64748B]">No sales recorded yet.</p>
              ) : (
                <table className="w-full text-[13px] mt-2">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] border-b border-[#F1F5F9]">
                      <th className="py-2 text-left font-medium">Product</th>
                      <th className="py-2 text-right font-medium">Price</th>
                      <th className="py-2 text-right font-medium">Sold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {stats.topSellingProducts.slice(0, 5).map((prod) => (
                      <tr key={prod._id} className="h-[42px]">
                        <td className="pr-3">
                          <p className="font-medium text-[#0F172A] truncate max-w-[230px]">
                            {prod.name}
                          </p>
                          <p className="text-[11px] text-[#64748B]">{prod.brand}</p>
                        </td>
                        <td className="text-right font-mono-data text-[#475569]">
                          {formatPKR(prod.price)}
                        </td>
                        <td className="text-right font-mono-data font-semibold text-[#15472B]">
                          {prod.soldCount ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>

          {/* Recent Orders */}
          <section className="bg-white border border-[#E2E8F0] p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="text-[14px] font-semibold text-[#0F172A]">Recent Orders</h3>
              <button
                type="button"
                onClick={() => onNavigateTab('orders')}
                className="text-[12px] text-[#15472B] font-medium hover:underline cursor-pointer"
              >
                Manage All Orders &rarr;
              </button>
            </div>
            {(stats.recentOrders ?? []).length === 0 ? (
              <p className="py-8 text-center text-[13px] text-[#64748B]">No recent orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] mt-2">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] border-b border-[#F1F5F9]">
                      <th className="py-2.5 text-left font-medium">Reference</th>
                      <th className="py-2.5 text-left font-medium">Customer</th>
                      <th className="py-2.5 text-left font-medium">City</th>
                      <th className="py-2.5 text-left font-medium">Payment</th>
                      <th className="py-2.5 text-left font-medium">Status</th>
                      <th className="py-2.5 text-right font-medium">Total</th>
                      <th className="py-2.5 text-right font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {stats.recentOrders.map((ord) => {
                      const statusMeta = ORDER_STATUS_META[ord.orderStatus];
                      return (
                        <tr
                          key={ord._id}
                          onClick={() => onOpenOrder(ord.orderReference)}
                          className="h-[42px] hover:bg-[#F8FAFC] cursor-pointer"
                        >
                          <td className="font-mono-data font-medium text-[#15472B]">
                            {ord.orderReference}
                          </td>
                          <td className="text-[#0F172A]">{ord.customer?.name}</td>
                          <td className="text-[#475569]">{ord.shippingAddress?.city}</td>
                          <td className="text-[#475569]">{ord.paymentMethod}</td>
                          <td className={`font-medium ${statusMeta?.colorClass ?? 'text-[#334155]'}`}>
                            {statusMeta?.label ?? ord.orderStatus}
                          </td>
                          <td className="text-right font-mono-data font-medium text-[#0F172A]">
                            {formatPKR(ord.total)}
                          </td>
                          <td className="text-right text-[#64748B] font-mono-data text-[12px]">
                            {formatDateTime(ord.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
