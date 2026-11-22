import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  TicketPercent,
  Search,
  RefreshCw,
  CheckCircle,
  Copy,
  Check,
  Percent,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Lock,
} from 'lucide-react';
import {
  createAdminCoupon,
  deleteAdminCoupon,
  fetchAdminCoupons,
  toggleAdminCoupon,
  updateAdminCoupon,
} from '../services/adminApi';
import type { AdminCoupon, DiscountType } from '../types/admin';
import { formatDate, formatPKR } from '../utils/formatters';

const EMPTY_COUPON: Partial<AdminCoupon> = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  minOrderAmount: 0,
  maxDiscountAmount: null,
  usageLimit: null,
  expiresAt: null,
  isActive: true,
};

export const CouponsView: React.FC = () => {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'expired'>('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdminCoupon>>(EMPTY_COUPON);
  const [saving, setSaving] = useState(false);

  // Two-step delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAdminCoupons();
      setCoupons(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCoupons();
  }, []);

  // Top 4 KPI Metrics
  const kpiData = useMemo(() => {
    const totalCount = coupons.length;
    let activeCount = 0;
    let totalRedemptions = 0;
    let maxDiscountVal = 0;
    const now = new Date();

    coupons.forEach((c) => {
      const isExpired = c.expiresAt ? new Date(c.expiresAt) < now : false;
      if (c.isActive && !isExpired) {
        activeCount += 1;
      }
      totalRedemptions += c.usedCount || 0;
      if (c.discountType === 'percentage' && c.discountValue > maxDiscountVal) {
        maxDiscountVal = c.discountValue;
      }
    });

    return {
      totalCount,
      activeCount,
      totalRedemptions,
      maxDiscountVal,
    };
  }, [coupons]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_COUPON);
    setModalOpen(true);
  };

  const openEdit = (coupon: AdminCoupon) => {
    setEditingId(coupon._id);
    setForm({
      ...coupon,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code?.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<AdminCoupon> = {
        code: form.code.trim().toUpperCase(),
        description: form.description?.trim() || '',
        discountType: (form.discountType || 'percentage') as DiscountType,
        discountValue: Number(form.discountValue || 0),
        minOrderAmount: Number(form.minOrderAmount || 0),
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        expiresAt: form.expiresAt || null,
        isActive: Boolean(form.isActive),
      };
      if (editingId) {
        await updateAdminCoupon(editingId, payload);
      } else {
        await createAdminCoupon(payload);
      }
      setModalOpen(false);
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon: AdminCoupon) => {
    try {
      await toggleAdminCoupon(coupon._id);
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle coupon.');
    }
  };

  const handleDelete = async (couponId: string) => {
    setDeletingId(couponId);
    try {
      await deleteAdminCoupon(couponId);
      setConfirmDeleteId(null);
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete coupon.');
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    return coupons.filter((c) => {
      const matchesSearch =
        !q ||
        c.code.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q);

      const isExpired = c.expiresAt ? new Date(c.expiresAt) < now : false;

      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = c.isActive && !isExpired;
      if (statusFilter === 'paused') matchesStatus = !c.isActive;
      if (statusFilter === 'expired') matchesStatus = isExpired;

      return matchesSearch && matchesStatus;
    });
  }, [coupons, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Title & Search Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-[25px] font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <TicketPercent className="w-6 h-6 text-[#15472B]" />
            Harvest Coupons &amp; Promotional Engine
          </h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Manage percentage and flat PKR discount vouchers, minimum basket thresholds, and live checkout validation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or description..."
              className="w-[200px] sm:w-[240px] border border-[#CBD5E1] bg-white rounded-xl pl-3.5 pr-9 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B] transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => void loadCoupons()}
            aria-label="Refresh coupons"
            title="Refresh Coupons"
            className="border border-[#E5E9E4] bg-white hover:border-[#0F172A] p-2 rounded-xl text-[#334155] cursor-pointer shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#15472B]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="bg-[#0E291C] hover:bg-[#15472B] text-white px-4 py-2 rounded-xl text-[12.5px] font-semibold tracking-wide cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-[#FECACA] bg-[#FEF2F2] rounded-2xl px-4 py-3 text-[13px] text-[#B91C1C] flex items-center gap-2 shadow-2xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626]" />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Coupons */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <TicketPercent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Total Vouchers</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Campaigns created</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {kpiData.totalCount}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">●</span>
              <span>{coupons.length} vouchers in database</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,58 C30,52 50,30 80,45 C110,60 125,25 140,32 L140,65 L0,65 Z"
                fill="url(#waveCoup1)"
              />
              <defs>
                <linearGradient id="waveCoup1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2: Active Promos */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Active Live</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Valid at checkout</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {kpiData.activeCount}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">✓</span>
              <span>Available for customer redemption</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M30,62 C60,48 85,22 115,38 C128,45 136,25 140,20 L140,65 L30,65 Z"
                fill="url(#waveCoup2)"
              />
              <defs>
                <linearGradient id="waveCoup2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BBF7D0" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.08" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 3: Total Redemptions */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Redemptions</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Used by customers</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {kpiData.totalRedemptions}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">↑</span>
              <span>Successful basket applications</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M10,65 C40,40 70,60 100,30 C120,45 130,20 140,25 L140,65 Z"
                fill="url(#waveCoup3)"
              />
              <defs>
                <linearGradient id="waveCoup3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 4: Max Promo Benefit */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Peak Discount</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Top active benefit</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {kpiData.maxDiscountVal > 0 ? `${kpiData.maxDiscountVal}%` : 'PKR Flat'}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">●</span>
              <span>Highest percentage promo</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,60 C40,55 60,35 90,45 C120,55 130,28 140,35 L140,65 Z"
                fill="url(#waveCoup4)"
              />
              <defs>
                <linearGradient id="waveCoup4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-[13px]">
        {(['all', 'active', 'paused', 'expired'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-semibold capitalize cursor-pointer transition-colors ${
              statusFilter === st
                ? 'bg-[#15472B] text-white'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
            }`}
          >
            {st === 'all' ? 'All Vouchers' : st}
          </button>
        ))}
        <span className="text-[#94A3B8] ml-auto text-[12px] font-mono-data">
          Showing {filteredCoupons.length} of {coupons.length}
        </span>
      </div>

      {/* Luxury Coupons Table */}
      <div className="bg-white rounded-2xl border border-[#E5E9E4] overflow-x-auto shadow-2xs">
        {loading && coupons.length === 0 ? (
          <div className="p-12 text-center text-[13.5px] text-[#64748B]">
            Loading coupons...
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-14 text-center space-y-3">
            <TicketPercent className="w-10 h-10 text-[#CBD5E1] mx-auto" />
            <p className="text-[14.5px] font-semibold text-[#0F172A]">
              No promotional vouchers found
            </p>
            <p className="text-[12.5px] text-[#64748B] max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'Create your first harvest promo code (such as ZAITOON10 or HARVEST20) to offer discounts at storefront checkout.'}
            </p>
            {!search && statusFilter === 'all' && (
              <button
                type="button"
                onClick={openCreate}
                className="bg-[#15472B] hover:bg-[#0F3620] text-white px-4 py-2 rounded-xl text-[12px] font-semibold cursor-pointer shadow-2xs"
              >
                Create First Voucher
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-3.5 px-5 text-left font-semibold">Voucher Code</th>
                <th className="py-3.5 px-5 text-left font-semibold">Discount Value</th>
                <th className="py-3.5 px-5 text-right font-semibold">Min Order</th>
                <th className="py-3.5 px-5 text-right font-semibold">Redemptions</th>
                <th className="py-3.5 px-5 text-left font-semibold">Validity</th>
                <th className="py-3.5 px-5 text-left font-semibold">Status</th>
                <th className="py-3.5 px-5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredCoupons.map((c) => {
                const now = new Date();
                const isExpired = c.expiresAt ? new Date(c.expiresAt) < now : false;
                const isConfirming = confirmDeleteId === c._id;
                const isDeleting = deletingId === c._id;

                return (
                  <tr key={c._id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Code & Description */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-data font-bold text-[13.5px] text-[#15472B] bg-[#F4F9F5] border border-[#D5E6D8] px-2.5 py-1 rounded-lg">
                          {c.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(c.code)}
                          title="Copy Code"
                          className="p-1 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer transition-colors"
                        >
                          {copiedCode === c.code ? (
                            <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {c.description && (
                        <p className="text-[11.5px] text-[#64748B] mt-1 max-w-[260px] truncate">
                          {c.description}
                        </p>
                      )}
                    </td>

                    {/* Discount Value */}
                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-[#0F172A] text-[13px]">
                        {c.discountType === 'percentage'
                          ? `${c.discountValue}% OFF`
                          : `${formatPKR(c.discountValue)} OFF`}
                      </span>
                      {c.maxDiscountAmount && (
                        <span className="block text-[11px] text-[#64748B] font-mono-data mt-0.5">
                          Capped at {formatPKR(c.maxDiscountAmount)}
                        </span>
                      )}
                    </td>

                    {/* Min Order */}
                    <td className="py-3.5 px-5 text-right font-mono-data text-[#475569]">
                      {c.minOrderAmount > 0 ? (
                        <span className="font-medium text-[#0F172A]">
                          {formatPKR(c.minOrderAmount)}
                        </span>
                      ) : (
                        <span className="text-[#94A3B8] text-[12px]">None</span>
                      )}
                    </td>

                    {/* Redemptions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="font-mono-data font-semibold text-[#0F172A]">
                        {c.usedCount}{' '}
                        <span className="text-[#94A3B8] font-normal">
                          / {c.usageLimit ? c.usageLimit : '∞'}
                        </span>
                      </div>
                      {c.usageLimit && (
                        <div className="w-16 h-1 bg-[#E2E8F0] rounded-full ml-auto mt-1 overflow-hidden">
                          <div
                            className="h-full bg-[#15472B] rounded-full"
                            style={{
                              width: `${Math.min(100, ((c.usedCount || 0) / c.usageLimit) * 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </td>

                    {/* Expiration */}
                    <td className="py-3.5 px-5 font-mono-data text-[12px]">
                      {c.expiresAt ? (
                        <span className={isExpired ? 'text-[#DC2626] font-semibold' : 'text-[#475569]'}>
                          {formatDate(c.expiresAt)}
                          {isExpired && ' (Expired)'}
                        </span>
                      ) : (
                        <span className="text-[#16A34A] font-semibold">No expiration</span>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-5">
                      <button
                        type="button"
                        onClick={() => void handleToggle(c)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                          isExpired
                            ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]'
                            : c.isActive
                            ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC] hover:bg-[#BBF7D0]'
                            : 'bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isExpired ? 'bg-[#DC2626]' : c.isActive ? 'bg-[#16A34A]' : 'bg-[#64748B]'
                          }`}
                        />
                        <span>{isExpired ? 'Expired' : c.isActive ? 'Active' : 'Paused'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          aria-label={`Edit ${c.code}`}
                          className="p-1.5 border border-[#CBD5E1] hover:border-[#0F172A] rounded-lg text-[#334155] cursor-pointer transition-colors shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {isConfirming ? (
                          <div className="inline-flex items-center gap-1.5 animate-in fade-in duration-150">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => void handleDelete(c._id)}
                              className="bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white px-2.5 py-1 text-[11px] font-semibold rounded-lg cursor-pointer shadow-2xs"
                            >
                              {isDeleting ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="border border-[#CBD5E1] px-2 py-1 text-[11px] text-[#475569] rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(c._id)}
                            aria-label={`Delete ${c.code}`}
                            className="p-1.5 border border-[#FECACA] hover:bg-[#FEF2F2] rounded-lg text-[#DC2626] cursor-pointer transition-colors shadow-2xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-[620px] max-h-[90vh] bg-white rounded-2xl border border-[#E5E9E4] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header with Signature Luxury Styling */}
            <div className="px-6 py-5 bg-[#0E291C] text-white flex items-center justify-between border-b border-[#1C4D32]">
              <div>
                <h3 className="text-[17px] font-bold text-white font-mono-data">
                  {editingId ? 'Edit Harvest Coupon' : 'Create New Promo Voucher'}
                </h3>
                <p className="text-[12px] text-white/70 mt-0.5">
                  Configure discount formula, cart eligibility thresholds, and expiration date.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-[13px]">
              {/* Code & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Promo Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ZAITOON20"
                    value={form.code || ''}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                    }
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 font-mono-data text-[13px] uppercase focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20% off all Early Harvest Olive Oils"
                    value={form.description || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                  />
                </div>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.discountType || 'percentage'}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        discountType: e.target.value as DiscountType,
                      }))
                    }
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] bg-white focus:outline-none focus:border-[#15472B]"
                  >
                    <option value="percentage">Percentage (%) Off</option>
                    <option value="flat">Flat Amount (PKR) Off</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Discount Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.discountValue ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, discountValue: Number(e.target.value) }))
                    }
                    placeholder={form.discountType === 'percentage' ? 'e.g. 15 for 15%' : 'e.g. 500 for Rs. 500'}
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Minimum Basket Amount (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.minOrderAmount ?? 0}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, minOrderAmount: Number(e.target.value) }))
                    }
                    placeholder="0 for no minimum"
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Maximum Discount Cap (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxDiscountAmount ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        maxDiscountAmount: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    placeholder="Optional max limit (e.g. 1500)"
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                  />
                </div>
              </div>

              {/* Usage Limit & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Maximum Usage Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.usageLimit ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        usageLimit: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    placeholder="Leave blank for unlimited"
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={form.expiresAt || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <label className="inline-flex items-center gap-2.5 cursor-pointer text-[13px] font-medium text-[#0F172A]">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isActive)}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="accent-[#15472B] w-4 h-4 rounded"
                  />
                  <span>Active &amp; redeemable at checkout</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-3 sticky bottom-0 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-[#CBD5E1] hover:bg-[#F1F5F9] px-4 py-2 text-[12.5px] font-medium text-[#334155] rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#15472B] hover:bg-[#0F3620] disabled:bg-[#94A3B8] text-white px-6 py-2 text-[12.5px] font-semibold rounded-xl cursor-pointer shadow-2xs transition-colors"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponsView;
