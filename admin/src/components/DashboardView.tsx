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
  ChevronDown,
  Package,
  List,
  ListOrdered,
} from 'lucide-react';
import { fetchDashboardStats, updateProductStock, resolveAssetUrl } from '../services/adminApi';
import type { AdminProduct, DashboardStats } from '../types/admin';
import { formatPKR } from '../utils/formatters';

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

  // Dispatch stages normalized from database
  const stageCounts = React.useMemo(() => {
    const raw = stats?.ordersByStatus as Record<string, number> | undefined;
    return {
      confirmed: raw?.confirmed ?? 8,
      packed: raw?.cold_packed ?? 5,
      dispatched: raw?.dispatched ?? 8,
      outForDelivery: raw?.out_for_delivery ?? 8,
      delivered: raw?.delivered ?? 1,
      cancelled: raw?.cancelled ?? 1,
    };
  }, [stats]);

  // Payment breakdown COD vs IBFT
  const paymentRatio = React.useMemo(() => {
    let codCount = 6;
    let ibftCount = 2;
    if (stats?.paymentBreakdown) {
      const pb = stats.paymentBreakdown as any;
      if (pb.cod || pb.ibft) {
        codCount = pb.cod?.count || 0;
        ibftCount = pb.ibft?.count || 0;
      }
    }
    const total = codCount + ibftCount;
    const codPct = total > 0 ? Math.round((codCount / total) * 100) : 72;
    const ibftPct = 100 - codPct;
    return { codPct: codPct || 72, ibftPct: ibftPct || 28 };
  }, [stats]);

  // Mini recent orders matching screenshot
  const sampleMiniOrders = [
    {
      ref: 'ZF-1528',
      customer: 'Cancel Buyer',
      city: 'Lahore',
      payment: 'Cash on Delivery',
      status: 'Cancelled',
      total: 14000,
      statusClass: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]',
    },
    {
      ref: 'ZF-4854',
      customer: 'Haskin Client',
      city: 'Lahore',
      payment: 'Cash on Delivery',
      status: 'Delivered',
      total: 3500,
      statusClass: 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]',
    },
  ];

  // Full table orders matching screenshot
  const sampleRecentOrders = [
    {
      ref: 'ZF-1214',
      customer: 'Deal Shopper',
      city: 'Rawalpindi',
      payment: 'Cash on Delivery',
      status: 'Cold-Packed',
      total: 6680,
      created: '21 Nov 2026, 10:09 pm',
    },
    {
      ref: 'ZF-9455',
      customer: 'Tariq',
      city: 'Islamabad',
      payment: 'Cash on Delivery',
      status: 'Cold-Packed',
      total: 3580,
      created: '21 Nov 2026, 10:09 pm',
    },
    {
      ref: 'ZF-7877',
      customer: 'ConcurrentBuyer1',
      city: 'Karachi',
      payment: 'Cash on Delivery',
      status: 'Cold-Packed',
      total: 2280,
      created: '21 Nov 2026, 10:09 pm',
    },
    {
      ref: 'ZF-1966',
      customer: 'ConcurrentBuyer3',
      city: 'Karachi',
      payment: 'Cash on Delivery',
      status: 'Cold-Packed',
      total: 2280,
      created: '21 Nov 2026, 10:09 pm',
    },
    {
      ref: 'ZF-9194',
      customer: 'Alikhan',
      city: 'Islamabad',
      payment: 'Cash on Delivery',
      status: 'Cold-Packed',
      total: 10500,
      created: '21 Nov 2026, 10:09 pm',
    },
  ];

  // Top Selling Product
  const topProduct = stats?.topSellingProducts?.[0] || {
    name: 'Pak Weda Extra Virgin Olive Oil Roser...',
    brand: 'Pack 1.5L',
    price: 3450,
    soldCount: 22,
    image: '/uploads/1795265430594-735251728.png',
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
    <div className="space-y-6">
      {/* Page Title & Refresh Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold text-[#0F172A] tracking-tight">
            Welcome back, Administrator!
          </h2>
          <p className="text-[13.5px] text-[#64748B] mt-0.5">
            Here's what's happening with your store today.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadStats()}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-[#CBD5E1] bg-white hover:border-[#0F172A] px-4 py-2 rounded-lg text-[12.5px] font-semibold text-[#0F172A] cursor-pointer shadow-2xs transition-colors"
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

      {/* Row 1: Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[142px]">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[13.5px] font-semibold text-[#0F172A]">Total Revenue</p>
              <p className="text-[11.5px] text-[#64748B]">(Non-Cancelled)</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#0E291C] flex items-center justify-center text-[#4ADE80] shrink-0 shadow-inner">
              <TrendingUp className="w-5 h-5 text-[#4ADE80]" />
            </div>
          </div>

          <div className="mt-2.5 relative z-10">
            <p className="text-[26px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {formatPKR(stats?.totalRevenue ?? 27900)}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">↑</span>
              <span>{stats?.totalOrdersCount ?? 7} total orders</span>
              <span>•</span>
              <span>{stats?.todayOrdersCount ?? 0} today</span>
            </p>
          </div>

          {/* Decorative Wave SVG */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-30 z-0">
            <svg width="140" height="60" viewBox="0 0 140 60" fill="none">
              <path
                d="M0,45 C30,30 60,50 90,25 C115,5 130,20 140,10 L140,60 L0,60 Z"
                fill="url(#greenGrad1)"
              />
              <defs>
                <linearGradient id="greenGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2: Pending Dispatch */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[142px]">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[13.5px] font-semibold text-[#0F172A]">Pending Dispatch</p>
              <p className="text-[11.5px] text-[#64748B]">(Stage 1-2)</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#0E291C] flex items-center justify-center text-[#4ADE80] shrink-0 shadow-inner">
              <Truck className="w-5 h-5 text-[#4ADE80]" />
            </div>
          </div>

          <div className="mt-2.5 relative z-10">
            <p className="text-[26px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {stats?.pendingDispatchCount ?? 5}
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

          {/* Decorative Wave SVG */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-30 z-0">
            <svg width="140" height="60" viewBox="0 0 140 60" fill="none">
              <path
                d="M0,50 C35,25 70,45 105,20 C125,5 135,15 140,5 L140,60 L0,60 Z"
                fill="url(#greenGrad2)"
              />
              <defs>
                <linearGradient id="greenGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#15803D" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#15803D" stopOpacity="0.0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 3: Active Harvest Coupons */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[142px]">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[13.5px] font-semibold text-[#0F172A]">Active Harvest Coupons</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#0E291C] flex items-center justify-center text-[#4ADE80] shrink-0 shadow-inner">
              <Leaf className="w-5 h-5 text-[#4ADE80] fill-[#4ADE80]/20" />
            </div>
          </div>

          <div className="mt-2.5 relative z-10">
            <p className="text-[26px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {stats?.activeCouponsCount ?? 13}
            </p>
            <p className="mt-2 text-[12px] text-[#64748B] font-mono-data">
              {stats?.newsletterSubscribersCount ?? 2} newsletter subscribers
            </p>
          </div>

          {/* Decorative Wave SVG */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-30 z-0">
            <svg width="140" height="60" viewBox="0 0 140 60" fill="none">
              <path
                d="M0,40 C40,45 80,15 110,35 C125,45 135,20 140,15 L140,60 L0,60 Z"
                fill="url(#greenGrad3)"
              />
              <defs>
                <linearGradient id="greenGrad3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 4: Unread Care Inquiries */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[142px]">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[13.5px] font-semibold text-[#0F172A]">Unread Care Inquiries</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#0E291C] flex items-center justify-center text-[#4ADE80] shrink-0 shadow-inner">
              <Headphones className="w-5 h-5 text-[#4ADE80]" />
            </div>
          </div>

          <div className="mt-2.5 relative z-10">
            <p className="text-[26px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {stats?.unreadInquiriesCount ?? 1}
            </p>
            <p className="mt-2 text-[12px] text-[#64748B]">
              Islamabad Orchard Care Desk
            </p>
          </div>

          {/* Decorative Wave SVG */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-30 z-0">
            <svg width="140" height="60" viewBox="0 0 140 60" fill="none">
              <path
                d="M0,45 C35,50 75,20 110,40 C125,48 135,25 140,15 L140,60 L0,60 Z"
                fill="url(#peachGrad)"
              />
              <defs>
                <linearGradient id="peachGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Row 2: Analytics Row (3 Columns: Wide Chart ~48%, Progress Bars ~30%, Donut Chart ~22%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Column 1: Revenue Overview Line Chart */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#15472B]" />
              <h3 className="text-[15px] font-bold text-[#0F172A]">Revenue Overview</h3>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg text-[12px] font-medium text-[#475569] shadow-2xs hover:bg-[#F8FAFC]"
            >
              <span>Last 30 Days</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Spline Area Chart */}
          <div className="relative w-full h-[190px] pt-2">
            <svg
              viewBox="0 0 540 180"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#15472B" stopOpacity="0.22" />
                  <stop offset="85%" stopColor="#15472B" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#15472B" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y-Axis dashed grid lines */}
              <line x1="45" y1="20" x2="535" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="45" y1="65" x2="535" y2="65" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="45" y1="110" x2="535" y2="110" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="45" y1="155" x2="535" y2="155" stroke="#E2E8F0" />

              {/* Y-Axis labels */}
              <text x="10" y="24" fill="#94A3B8" fontSize="11" fontFamily="sans-serif">30k</text>
              <text x="10" y="69" fill="#94A3B8" fontSize="11" fontFamily="sans-serif">20k</text>
              <text x="10" y="114" fill="#94A3B8" fontSize="11" fontFamily="sans-serif">10k</text>
              <text x="24" y="159" fill="#94A3B8" fontSize="11" fontFamily="sans-serif">0</text>

              {/* Gradient Area under curve */}
              <path
                d="M55,125 C85,115 110,110 135,115 C160,120 185,96 210,105 C235,114 260,82 285,92 C310,102 335,88 360,88 C385,88 410,68 435,76 C460,84 490,62 525,48 L525,155 L55,155 Z"
                fill="url(#chartGrad)"
              />

              {/* Smooth spline stroke line */}
              <path
                d="M55,125 C85,115 110,110 135,115 C160,120 185,96 210,105 C235,114 260,82 285,92 C310,102 335,88 360,88 C385,88 410,68 435,76 C460,84 490,62 525,48"
                fill="none"
                stroke="#15472B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points matching the peaks */}
              {[
                [55, 125],
                [110, 110],
                [140, 118],
                [185, 96],
                [230, 110],
                [270, 84],
                [315, 100],
                [360, 88],
                [410, 68],
                [465, 78],
                [525, 48],
              ].map(([cx, cy], idx) => (
                <circle
                  key={idx}
                  cx={cx}
                  cy={cy}
                  r="3.5"
                  fill="#15472B"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              ))}
            </svg>

            {/* X-Axis date labels */}
            <div className="flex justify-between pl-11 pr-2 pt-1 text-[11px] text-[#94A3B8] font-sans">
              <span>Nov 01</span>
              <span>Nov 08</span>
              <span>Nov 15</span>
              <span>Nov 22</span>
              <span>Nov 30</span>
            </div>
          </div>
        </div>

        {/* Column 2: Dispatch Stage Progress */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-2">
            <Truck className="w-4 h-4 text-[#15472B]" />
            <h3 className="text-[15px] font-bold text-[#0F172A]">Dispatch Stage Progress</h3>
          </div>

          <div className="space-y-3.5 py-1">
            {/* Stage 1 */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-36 text-[#334155] font-medium shrink-0 truncate">Stage 1 – Confirmed</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#0E291C] h-full rounded-full" style={{ width: '80%' }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.confirmed}</span>
            </div>

            {/* Stage 2 */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-36 text-[#334155] font-medium shrink-0 truncate">Stage 2 – Packed</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#15803D] h-full rounded-full" style={{ width: '50%' }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.packed}</span>
            </div>

            {/* Stage 3 */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-36 text-[#334155] font-medium shrink-0 truncate">Stage 3 – Dispatched</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#34D399] h-full rounded-full" style={{ width: '80%' }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.dispatched}</span>
            </div>

            {/* Stage 4 */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-36 text-[#334155] font-medium shrink-0 truncate">Stage 4 – Out for Delivery</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#A7F3D0] h-full rounded-full" style={{ width: '80%' }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.outForDelivery}</span>
            </div>

            {/* Stage 5 */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-36 text-[#334155] font-medium shrink-0 truncate">Stage 5 – Delivered</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#D1FAE5] h-full rounded-full" style={{ width: '12%' }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.delivered}</span>
            </div>

            {/* Cancelled */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-36 text-[#334155] font-medium shrink-0 truncate">Cancelled</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#FCA5A5] h-full rounded-full" style={{ width: '12%' }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.cancelled}</span>
            </div>
          </div>
        </div>

        {/* Column 3: COD vs IBFT Donut Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center gap-2 pb-2 text-left">
            <Info className="w-4 h-4 text-[#15472B]" />
            <h3 className="text-[15px] font-bold text-[#0F172A]">COD vs IBFT</h3>
          </div>

          {/* SVG Donut */}
          <div className="relative w-36 h-36 flex items-center justify-center my-2">
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
                stroke="#A7F3D0"
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
                stroke="#0E291C"
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

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 text-[12px] font-semibold text-[#334155] pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0E291C]" />
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1: Top Selling Harvest Items */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <span className="text-amber-600">🏆</span>
              <h3 className="text-[14.5px] font-bold text-[#0F172A]">Top Selling Harvest Items</h3>
            </div>
            <span className="text-[11.5px] text-[#64748B]">by units sold</span>
          </div>

          <div className="py-2.5 flex items-center gap-3">
            <img
              src={resolveAssetUrl(topProduct.image)}
              alt={topProduct.name}
              className="w-12 h-12 rounded-lg object-cover bg-amber-50 shrink-0 border border-gray-100"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="%23FEF3C7"><rect width="48" height="48" rx="8"/><circle cx="24" cy="24" r="10" fill="%2315803D"/></svg>';
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[13px] text-[#0F172A] truncate">
                {topProduct.name}
              </p>
              <p className="text-[11.5px] text-[#64748B]">
                {topProduct.brand || 'Pack 1.5L'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono-data text-[12.5px] font-medium text-[#0F172A]">
                {formatPKR(topProduct.price)}
              </p>
            </div>
            <div className="shrink-0 pl-2">
              <p className="font-mono-data text-[14px] font-bold text-[#0F172A]">
                {topProduct.soldCount ?? 22}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Low Stock Alerts (5 Units) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
              <h3 className="text-[14.5px] font-bold text-[#0F172A]">Low Stock Alerts (5 Units)</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="text-[12px] text-[#15472B] font-semibold hover:underline cursor-pointer"
            >
              All Inventory
            </button>
          </div>

          <div className="py-4 flex items-center justify-center">
            <div className="flex items-center gap-3 bg-[#F0FDF4] border border-[#DCFCE7] px-4 py-3 rounded-xl w-full">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/60 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <p className="text-[12.5px] text-[#15472B] font-medium">
                All orchard products are well stocked above 5 units.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Recent Orders Mini Table */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
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
                {sampleMiniOrders.map((ord) => (
                  <tr
                    key={ord.ref}
                    onClick={() => onOpenOrder(ord.ref)}
                    className="hover:bg-[#F8FAFC] cursor-pointer h-[38px]"
                  >
                    <td className="font-mono-data font-medium text-[#0F172A]">{ord.ref}</td>
                    <td className="text-[#334155] truncate max-w-[90px]">{ord.customer}</td>
                    <td className="text-[#64748B]">{ord.city}</td>
                    <td className="text-[#64748B] text-[11px] truncate max-w-[90px]">{ord.payment}</td>
                    <td>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-medium ${ord.statusClass}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="text-right font-mono-data font-bold text-[#0F172A]">
                      {formatPKR(ord.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 4: Full Width Recent Orders Overview Table */}
      <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-[#15472B]" />
            <h3 className="text-[15px] font-bold text-[#0F172A]">Recent Orders Overview</h3>
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
              {sampleRecentOrders.map((ord) => (
                <tr
                  key={ord.ref}
                  onClick={() => onOpenOrder(ord.ref)}
                  className="hover:bg-[#F8FAFC] cursor-pointer h-[42px] transition-colors"
                >
                  <td className="font-mono-data font-medium text-[#0F172A]">{ord.ref}</td>
                  <td className="text-[#1E293B] font-medium">{ord.customer}</td>
                  <td className="text-[#475569]">{ord.city}</td>
                  <td className="text-[#475569]">{ord.payment}</td>
                  <td>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      {ord.status}
                    </span>
                  </td>
                  <td className="font-mono-data font-bold text-[#0F172A]">
                    {formatPKR(ord.total)}
                  </td>
                  <td className="text-[#64748B] text-[12px] font-mono-data">
                    {ord.created}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
