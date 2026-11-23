import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  Truck,
  TrendingUp,
  Leaf,
  Headphones,
  Info,
  List,
  ListOrdered,
} from 'lucide-react';
import { fetchDashboardStats, resolveAssetUrl } from '../services/adminApi';
import type { AdminOrder, DashboardStats } from '../types/admin';
import { formatPKR } from '../utils/formatters';

interface DashboardViewProps {
  onOpenOrder: (orderReference: string) => void;
  onNavigateTab: (tab: 'orders' | 'products' | 'coupons' | 'inquiries' | 'newsletter') => void;
}

const getStatusCount = (
  statuses: DashboardStats['ordersByStatus'] | undefined,
  status: string
): number => {
  if (!statuses) return 0;
  if (Array.isArray(statuses)) {
    return statuses.find((item) => (item.status ?? item._id) === status)?.count ?? 0;
  }
  return statuses[status] ?? 0;
};

const getPaymentCounts = (
  breakdown: DashboardStats['paymentBreakdown'] | undefined
): { cod: number; ibft: number } => {
  if (!breakdown) return { cod: 0, ibft: 0 };

  const isCod = (method: string) => /cod|cash on delivery/i.test(method);
  const isIbft = (method: string) => /ibft|bank transfer/i.test(method);

  if (Array.isArray(breakdown)) {
    return breakdown.reduce(
      (counts, payment) => {
        const method = `${payment.paymentMethod ?? ''} ${payment._id ?? ''}`;
        if (isCod(method)) counts.cod += payment.count;
        if (isIbft(method)) counts.ibft += payment.count;
        return counts;
      },
      { cod: 0, ibft: 0 }
    );
  }

  return Object.entries(breakdown).reduce(
    (counts, [method, payment]) => {
      if (isCod(method)) counts.cod += payment.count;
      if (isIbft(method)) counts.ibft += payment.count;
      return counts;
    },
    { cod: 0, ibft: 0 }
  );
};

const formatOrderDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
};

const getOrderStatusLabel = (order: AdminOrder): string =>
  order.orderStatus.replace(/_/g, ' ');

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenOrder,
  onNavigateTab,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const stageCounts = React.useMemo(() => {
    return {
      confirmed: getStatusCount(stats?.ordersByStatus, 'confirmed'),
      packed: getStatusCount(stats?.ordersByStatus, 'cold_packed'),
      dispatched: getStatusCount(stats?.ordersByStatus, 'dispatched'),
      outForDelivery: getStatusCount(stats?.ordersByStatus, 'out_for_delivery'),
      delivered: getStatusCount(stats?.ordersByStatus, 'delivered'),
      cancelled: getStatusCount(stats?.ordersByStatus, 'cancelled'),
    };
  }, [stats]);
  const maxStageCount = Math.max(1, ...Object.values(stageCounts));
  const getStageWidth = (count: number) => `${(count / maxStageCount) * 100}%`;

  const paymentRatio = React.useMemo(() => {
    const { cod, ibft } = getPaymentCounts(stats?.paymentBreakdown);
    const total = cod + ibft;
    const codPct = total > 0 ? Math.round((cod / total) * 100) : 0;
    return { codPct, ibftPct: total > 0 ? 100 - codPct : 0 };
  }, [stats]);
  const recentOrders = stats?.recentOrders ?? [];
  const lowStockProducts = stats?.lowStockProducts ?? [];
  const topProduct = stats?.topSellingProducts?.[0];

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-gray-200" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-gray-200" />
      </div>
    );
  }

  // SVG Donut radius & circumference: r=44 => 2*pi*r ≈ 276.46
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const codDash = (paymentRatio.codPct / 100) * circumference;
  const ibftDash = circumference - codDash;

  return (
    <div className="space-y-5">
      {/* Page Title & Refresh Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[25px] font-bold text-[#0F172A] tracking-tight">
            Welcome back, Administrator!
          </h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Here's what's happening with your store today.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadStats()}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-[#CBD5E1] bg-white hover:border-[#0F172A] px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold text-[#0F172A] cursor-pointer shadow-2xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {error && (
        <div className="border border-[#FECACA] bg-[#FEF2F2] rounded-xl px-4 py-3 text-[13px] text-[#B91C1C]">
          {error}
        </div>
      )}

      {/* Row 1: Top 4 KPI Metric Cards (One single row of 4 cards on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner">
              {/* 3 green bar chart columns */}
              <div className="flex items-end gap-0.5 h-4.5 w-4.5 justify-center pb-0.5">
                <span className="w-1 bg-[#4ADE80] h-2.5 rounded-xs" />
                <span className="w-1 bg-[#4ADE80] h-4 rounded-xs" />
                <span className="w-1 bg-[#4ADE80] h-3 rounded-xs" />
              </div>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Total Revenue</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">(Non-Cancelled)</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {formatPKR(stats?.totalRevenue ?? 0)}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span>{stats?.totalOrdersCount ?? 0} total orders</span>
              <span>•</span>
              <span>{stats?.todayOrdersCount ?? 0} today</span>
            </p>
          </div>

          {/* Decorative Wave SVG in bottom right */}
          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,58 C30,52 50,30 80,45 C110,60 125,25 140,32 L140,65 L0,65 Z"
                fill="url(#waveGreen1)"
              />
              <path
                d="M30,62 C60,48 85,22 115,38 C128,45 136,25 140,20 L140,65 L30,65 Z"
                fill="url(#waveGreen1b)"
              />
              <defs>
                <linearGradient id="waveGreen1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="waveGreen1b" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BBF7D0" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.08" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2: Pending Dispatch */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center text-[#4ADE80] shrink-0 shadow-inner">
              <Truck className="w-5 h-5 text-[#4ADE80]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Pending Dispatch</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">(Stage 1-2)</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {stats?.pendingDispatchCount ?? 0}
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="mt-2 text-[12px] text-[#15472B] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open dispatch queue</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Decorative Wave SVG in bottom right */}
          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,60 C40,35 70,55 100,28 C120,8 132,22 140,12 L140,65 L0,65 Z"
                fill="url(#waveGreen2)"
              />
              <defs>
                <linearGradient id="waveGreen2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 3: Active Harvest Coupons */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center text-[#4ADE80] shrink-0 shadow-inner">
              <Leaf className="w-5 h-5 text-[#4ADE80] fill-[#4ADE80]/20" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Active Coupons</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {stats?.activeCouponsCount ?? 0}
            </p>
            <p className="mt-2 text-[12px] text-[#64748B] font-mono-data">
              {stats?.newsletterSubscribersCount ?? 0} newsletter subscribers
            </p>
          </div>

          {/* Decorative Wave SVG in bottom right */}
          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,62 C35,42 65,52 95,28 C118,10 132,26 140,18 L140,65 L0,65 Z"
                fill="url(#waveGreen3)"
              />
              <defs>
                <linearGradient id="waveGreen3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 4: Unread Care Inquiries */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center text-[#4ADE80] shrink-0 shadow-inner">
              <Headphones className="w-5 h-5 text-[#4ADE80]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Unread Care Inquiries</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {stats?.unreadInquiriesCount ?? 0}
            </p>
            <p className="mt-2 text-[12px] text-[#64748B]">
              Unread customer inquiries
            </p>
          </div>

          {/* Decorative Wave SVG in bottom right (Peach/Sand curve in Image 1) */}
          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,62 C35,48 65,35 95,45 C120,52 135,26 140,18 L140,65 L0,65 Z"
                fill="url(#wavePeach)"
              />
              <defs>
                <linearGradient id="wavePeach" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FDBA74" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#EA580C" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Row 2: Analytics Row (3 Columns: Wide Chart ~48%, Progress Bars ~30%, Donut Chart ~22%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Column 1: Revenue Overview Line Chart */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#15472B]" />
              <h3 className="text-[14.5px] font-bold text-[#0F172A]">Revenue Overview</h3>
            </div>
            <span className="text-[11px] text-[#64748B]">Trend data unavailable</span>
          </div>

          <div className="flex-1 min-h-[185px] flex items-center justify-center text-center px-6">
            <p className="max-w-[34ch] text-[13px] leading-relaxed text-[#64748B]">
              Daily revenue history is not available from the dashboard data.
            </p>
          </div>
        </div>

        {/* Column 2: Dispatch Stage Progress */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-2">
            <Truck className="w-4 h-4 text-[#15472B]" />
            <h3 className="text-[14.5px] font-bold text-[#0F172A]">Dispatch Stage Progress</h3>
          </div>

          <div className="space-y-3.5 py-1">
            {/* Stage 1 */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-34 text-[#334155] font-medium shrink-0 truncate">Stage 1 – Confirmed</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#0D3B22] h-full rounded-full" style={{ width: getStageWidth(stageCounts.confirmed) }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.confirmed}</span>
            </div>

            {/* Stage 2 */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-34 text-[#334155] font-medium shrink-0 truncate">Stage 2 – Packed</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#15803D] h-full rounded-full" style={{ width: getStageWidth(stageCounts.packed) }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.packed}</span>
            </div>

            {/* Stage 3 */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-34 text-[#334155] font-medium shrink-0 truncate">Stage 3 – Dispatched</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#4ADE80] h-full rounded-full" style={{ width: getStageWidth(stageCounts.dispatched) }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.dispatched}</span>
            </div>

            {/* Stage 4 */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-34 text-[#334155] font-medium shrink-0 truncate">Stage 4 – Out for Delivery</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#A7F3D0] h-full rounded-full" style={{ width: getStageWidth(stageCounts.outForDelivery) }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.outForDelivery}</span>
            </div>

            {/* Stage 5 */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-34 text-[#334155] font-medium shrink-0 truncate">Stage 5 – Delivered</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#D1FAE5] h-full rounded-full" style={{ width: getStageWidth(stageCounts.delivered) }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.delivered}</span>
            </div>

            {/* Cancelled */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-34 text-[#334155] font-medium shrink-0 truncate">Cancelled</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#FCA5A5] h-full rounded-full" style={{ width: getStageWidth(stageCounts.cancelled) }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.cancelled}</span>
            </div>
          </div>
        </div>

        {/* Column 3: COD vs IBFT Donut Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center gap-2 pb-2 text-left">
            <Info className="w-4 h-4 text-[#15472B]" />
            <h3 className="text-[14.5px] font-bold text-[#0F172A]">COD vs IBFT</h3>
          </div>

          {/* SVG Donut */}
          {paymentRatio.codPct || paymentRatio.ibftPct ? (
            <div className="relative w-36 h-36 flex items-center justify-center my-1.5">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="13"
              />
              {/* IBFT light mint segment */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#D6E8DC"
                strokeWidth="13"
                strokeDasharray={`${ibftDash} ${circumference}`}
                strokeDashoffset={-codDash}
              />
              {/* COD dark green segment */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#0F3520"
                strokeWidth="13"
                strokeDasharray={`${codDash} ${circumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[22px] font-bold text-[#0F172A] font-mono-data leading-none">
                {paymentRatio.codPct}%
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mt-0.5">
                COD
              </span>
            </div>
          </div>
          ) : (
            <div className="flex-1 min-h-[144px] flex items-center justify-center text-[13px] text-[#64748B]">
              No payment data available.
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 text-[12px] font-semibold text-[#334155] pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F3520]" />
              <span>COD {paymentRatio.codPct}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#64748B]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A7F3D0]" />
              <span>IBFT {paymentRatio.ibftPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: 3 Cards (Top Selling, Low Stock, Recent Orders Mini) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Top-selling product */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <span className="text-amber-600">🏆</span>
              <h3 className="text-[14.5px] font-bold text-[#0F172A]">Top-selling product</h3>
            </div>
            <span className="text-[11.5px] text-[#64748B]">by units sold</span>
          </div>

          {topProduct ? (
            <div className="py-2.5 flex items-center gap-3">
              {topProduct.image && (
                <img
                  src={resolveAssetUrl(topProduct.image)}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover bg-[#F3EBDE] shrink-0 border border-[#E6DDD0]"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[13px] text-[#0F172A] truncate">{topProduct.name}</p>
                <p className="text-[11.5px] text-[#64748B] truncate">{topProduct.brand} · {topProduct.size}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono-data text-[12.5px] font-medium text-[#0F172A]">{formatPKR(topProduct.price)}</p>
                <p className="font-mono-data text-[11px] text-[#64748B]">{topProduct.soldCount} sold</p>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-[13px] text-[#64748B]">No sales data available.</p>
          )}
        </div>

        {/* Card 2: Low stock products */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
              <h3 className="text-[14.5px] font-bold text-[#0F172A]">Low stock products</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="text-[12px] text-[#15472B] font-semibold hover:underline cursor-pointer"
            >
              All Inventory
            </button>
          </div>

          {lowStockProducts.length ? (
            <ul className="py-2 divide-y divide-[#F1F5F9]">
              {lowStockProducts.slice(0, 3).map((product) => (
                <li key={product._id} className="flex items-center justify-between gap-3 py-2 text-[12px]">
                  <span className="truncate font-medium text-[#334155]">{product.name}</span>
                  <span className="shrink-0 font-mono-data text-[#9A3412]">{product.stock} left</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-[13px] text-[#64748B]">No low-stock products reported.</p>
          )}
        </div>

        {/* Card 3: Recent Orders Mini Table */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-[#15472B]" />
              <h3 className="text-[14.5px] font-bold text-[#0F172A]">Recent Orders</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-[12px] text-[#15472B] font-semibold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Manage All Orders</span>
              <span>&rarr;</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] mt-1">
              <thead>
                <tr className="text-[10.5px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#F1F5F9]">
                  <th className="py-1.5 text-left font-semibold">#</th>
                  <th className="py-1.5 text-left font-semibold">Customer</th>
                  <th className="py-1.5 text-left font-semibold">City</th>
                  <th className="py-1.5 text-left font-semibold">Payment</th>
                  <th className="py-1.5 text-left font-semibold">Status</th>
                  <th className="py-1.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {recentOrders.slice(0, 2).map((ord) => (
                  <tr
                    key={ord._id}
                    onClick={() => onOpenOrder(ord.orderReference)}
                    className="hover:bg-[#F8FAFC] cursor-pointer h-[38px]"
                  >
                    <td className="font-mono-data font-medium text-[#0F172A]">{ord.orderReference}</td>
                    <td className="text-[#334155] truncate max-w-[90px]">{ord.customer.name}</td>
                    <td className="text-[#64748B]">{ord.shippingAddress.city}</td>
                    <td className="text-[#64748B] text-[11px] truncate max-w-[90px]">{ord.paymentMethod}</td>
                    <td>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#F3F4F6] text-[#374151]">
                        {getOrderStatusLabel(ord)}
                      </span>
                    </td>
                    <td className="text-right font-mono-data font-bold text-[#0F172A]">
                      {formatPKR(ord.total)}
                    </td>
                  </tr>
                ))}
                {!recentOrders.length && (
                  <tr><td colSpan={6} className="py-6 text-center text-[12px] text-[#64748B]">No recent orders available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 4: Full Width Recent Orders Overview Table */}
      <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-[#15472B]" />
            <h3 className="text-[14.5px] font-bold text-[#0F172A]">Recent Orders Overview</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="text-[12.5px] text-[#15472B] font-semibold hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>View All</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px] mt-2">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#F1F5F9]">
                <th className="py-2.5 text-left font-semibold">#</th>
                <th className="py-2.5 text-left font-semibold">Customer</th>
                <th className="py-2.5 text-left font-semibold">City</th>
                <th className="py-2.5 text-left font-semibold">Payment Method</th>
                <th className="py-2.5 text-left font-semibold">Status</th>
                <th className="py-2.5 text-left font-semibold">Total</th>
                <th className="py-2.5 text-left font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {recentOrders.slice(0, 5).map((ord) => (
                <tr
                  key={ord._id}
                  onClick={() => onOpenOrder(ord.orderReference)}
                  className="hover:bg-[#F8FAFC] cursor-pointer h-[42px] transition-colors"
                >
                  <td className="font-mono-data font-medium text-[#0F172A]">{ord.orderReference}</td>
                  <td className="text-[#1E293B] font-medium">{ord.customer.name}</td>
                  <td className="text-[#475569]">{ord.shippingAddress.city}</td>
                  <td className="text-[#475569]">{ord.paymentMethod}</td>
                  <td>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      {getOrderStatusLabel(ord)}
                    </span>
                  </td>
                  <td className="font-mono-data font-bold text-[#0F172A]">
                    {formatPKR(ord.total)}
                  </td>
                  <td className="text-[#64748B] text-[12px] font-mono-data">
                    {formatOrderDate(ord.createdAt)}
                  </td>
                </tr>
              ))}
              {!recentOrders.length && (
                <tr><td colSpan={7} className="py-8 text-center text-[13px] text-[#64748B]">No recent orders available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
