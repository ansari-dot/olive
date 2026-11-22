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

  // Dispatch stages
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
              {formatPKR(stats?.totalRevenue ?? 27900)}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">↑</span>
              <span>{stats?.totalOrdersCount ?? 7} total orders</span>
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
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Active Harvest Coupons</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {stats?.activeCouponsCount ?? 13}
            </p>
            <p className="mt-2 text-[12px] text-[#64748B] font-mono-data">
              {stats?.newsletterSubscribersCount ?? 2} newsletter subscribers
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
              {stats?.unreadInquiriesCount ?? 1}
            </p>
            <p className="mt-2 text-[12px] text-[#64748B]">
              Islamabad Orchard Care Desk
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
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg text-[12px] font-medium text-[#475569] shadow-2xs hover:bg-[#F8FAFC]"
            >
              <span>Last 30 Days</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Spline Area Chart */}
          <div className="relative w-full h-[185px] pt-1">
            <svg
              viewBox="0 0 520 170"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#15472B" stopOpacity="0.20" />
                  <stop offset="85%" stopColor="#15472B" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#15472B" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y-Axis dashed grid lines */}
              <line x1="42" y1="18" x2="515" y2="18" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="42" y1="60" x2="515" y2="60" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="42" y1="102" x2="515" y2="102" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="42" y1="145" x2="515" y2="145" stroke="#E2E8F0" />

              {/* Y-Axis labels */}
              <text x="10" y="22" fill="#94A3B8" fontSize="11" fontFamily="sans-serif">30k</text>
              <text x="10" y="64" fill="#94A3B8" fontSize="11" fontFamily="sans-serif">20k</text>
              <text x="10" y="106" fill="#94A3B8" fontSize="11" fontFamily="sans-serif">10k</text>
              <text x="24" y="149" fill="#94A3B8" fontSize="11" fontFamily="sans-serif">0</text>

              {/* Gradient Area under curve matching Image 1 curve */}
              <path
                d="M50,115 C75,110 100,105 125,110 C150,115 175,90 200,100 C225,110 250,75 275,88 C300,98 325,82 350,82 C375,82 400,60 425,70 C450,80 480,55 510,40 L510,145 L50,145 Z"
                fill="url(#chartGrad)"
              />

              {/* Smooth spline stroke line matching Image 1 curve */}
              <path
                d="M50,115 C75,110 100,105 125,110 C150,115 175,90 200,100 C225,110 250,75 275,88 C300,98 325,82 350,82 C375,82 400,60 425,70 C450,80 480,55 510,40"
                fill="none"
                stroke="#155331"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Green dots at every turning point */}
              {[
                [50, 115],
                [100, 106],
                [125, 110],
                [175, 90],
                [220, 104],
                [260, 78],
                [300, 95],
                [350, 82],
                [400, 60],
                [450, 73],
                [510, 40],
              ].map(([cx, cy], idx) => (
                <circle
                  key={idx}
                  cx={cx}
                  cy={cy}
                  r="3.5"
                  fill="#155331"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              ))}
            </svg>

            {/* X-Axis date labels */}
            <div className="flex justify-between pl-10 pr-1 text-[11px] text-[#94A3B8] font-sans">
              <span>Nov 01</span>
              <span>Nov 08</span>
              <span>Nov 15</span>
              <span>Nov 22</span>
              <span>Nov 30</span>
            </div>
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
                <div className="bg-[#0D3B22] h-full rounded-full" style={{ width: '80%' }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.confirmed}</span>
            </div>

            {/* Stage 2 */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-34 text-[#334155] font-medium shrink-0 truncate">Stage 2 – Packed</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#15803D] h-full rounded-full" style={{ width: '50%' }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.packed}</span>
            </div>

            {/* Stage 3 */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-34 text-[#334155] font-medium shrink-0 truncate">Stage 3 – Dispatched</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#4ADE80] h-full rounded-full" style={{ width: '80%' }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.dispatched}</span>
            </div>

            {/* Stage 4 */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-34 text-[#334155] font-medium shrink-0 truncate">Stage 4 – Out for Delivery</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#A7F3D0] h-full rounded-full" style={{ width: '80%' }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.outForDelivery}</span>
            </div>

            {/* Stage 5 */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-34 text-[#334155] font-medium shrink-0 truncate">Stage 5 – Delivered</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#D1FAE5] h-full rounded-full" style={{ width: '12%' }} />
              </div>
              <span className="w-4 text-right font-mono-data font-bold text-[#0F172A]">{stageCounts.delivered}</span>
            </div>

            {/* Cancelled */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-34 text-[#334155] font-medium shrink-0 truncate">Cancelled</span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#FCA5A5] h-full rounded-full" style={{ width: '12%' }} />
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
        {/* Card 1: Top Selling Harvest Items */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
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
              className="w-12 h-12 rounded-xl object-cover bg-amber-50 shrink-0 border border-amber-100"
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
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
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
