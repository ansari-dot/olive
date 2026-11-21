import React, { useEffect, useMemo, useState } from 'react';
import {
  Flame,
  Plus,
  Search,
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  RefreshCw,
  Percent,
  Check,
} from 'lucide-react';
import {
  fetchAdminDeals,
  createAdminDeal,
  updateAdminDeal,
  toggleAdminDeal,
  deleteAdminDeal,
  fetchAdminProducts,
  resolveMediaUrl,
} from '../services/adminApi';
import type { AdminDeal, AdminProduct, DealStatus } from '../types/admin';
import { formatDateTime, formatPKR } from '../utils/formatters';

type FilterTab = 'all' | 'active' | 'scheduled' | 'expired' | 'sold_out' | 'disabled';

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getTimeRemaining(startsAt: string, endsAt: string, status: DealStatus): string {
  const now = new Date().getTime();
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();

  if (status === 'disabled') return 'Disabled';
  if (status === 'sold_out') return 'Sold Out';
  if (status === 'expired' || now > end) return 'Expired';
  if (now < start) {
    const diffHours = Math.ceil((start - now) / (1000 * 60 * 60));
    if (diffHours > 24) {
      return `Starts in ${Math.round(diffHours / 24)} days`;
    }
    return `Starts in ${diffHours} hours`;
  }

  const diffMs = end - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  if (days > 0) {
    return `${days}d ${remHours}h left`;
  }
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m left`;
}

export const DealsView: React.FC = () => {
  const [deals, setDeals] = useState<AdminDeal[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<AdminDeal | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [dealTitle, setDealTitle] = useState('Flash Deal');
  const [dealDescription, setDealDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed_price'>('percent');
  const [discountPercentVal, setDiscountPercentVal] = useState<number>(13);
  const [dealPriceVal, setDealPriceVal] = useState<number>(0);
  const [customBadge, setCustomBadge] = useState('');
  const [startsAtVal, setStartsAtVal] = useState('');
  const [endsAtVal, setEndsAtVal] = useState('');
  const [dealStockLimitVal, setDealStockLimitVal] = useState<number>(0);
  const [isActiveVal, setIsActiveVal] = useState(true);

  // Product search inside modal
  const [prodSearch, setProdSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dealsList, prodList] = await Promise.all([
        fetchAdminDeals(),
        fetchAdminProducts(),
      ]);
      setDeals(dealsList);
      setProducts(prodList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p._id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Recalculate deal pricing when selected product or discount percentage changes
  const handleProductSelect = (prod: AdminProduct) => {
    setSelectedProductId(prod._id);
    const base = prod.price;
    const defaultPct = discountPercentVal > 0 ? discountPercentVal : 13;
    const newDealPrice = Math.max(1, Math.round(base * (1 - defaultPct / 100)));
    setDealPriceVal(newDealPrice);
    if (!customBadge) {
      setCustomBadge(`-${defaultPct}%`);
    }
  };

  const handlePercentChange = (pct: number) => {
    const validPct = Math.min(99, Math.max(1, pct || 1));
    setDiscountPercentVal(validPct);
    setDiscountType('percent');
    if (selectedProduct) {
      const newDealPrice = Math.max(1, Math.round(selectedProduct.price * (1 - validPct / 100)));
      setDealPriceVal(newDealPrice);
    }
    setCustomBadge(`-${validPct}%`);
  };

  const handleDealPriceChange = (price: number) => {
    setDealPriceVal(price);
    setDiscountType('fixed_price');
    if (selectedProduct && selectedProduct.price > 0) {
      const base = selectedProduct.price;
      if (price < base) {
        const pct = Math.max(1, Math.min(99, Math.round(((base - price) / base) * 100)));
        setDiscountPercentVal(pct);
        setCustomBadge(`-${pct}%`);
      }
    }
  };

  const openCreateModal = () => {
    setEditingDeal(null);
    setModalError(null);
    setProdSearch('');
    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    setStartsAtVal(toLocalDateTimeString(now));
    setEndsAtVal(toLocalDateTimeString(tomorrow));
    setDealTitle('Flash Deal');
    setDealDescription('');
    setDiscountType('percent');
    setDiscountPercentVal(13);
    setCustomBadge('-13%');
    setDealStockLimitVal(0);
    setIsActiveVal(true);

    if (products.length > 0) {
      const first = products[0];
      setSelectedProductId(first._id);
      const newDealPrice = Math.round(first.price * (1 - 13 / 100));
      setDealPriceVal(newDealPrice);
    } else {
      setSelectedProductId('');
      setDealPriceVal(0);
    }

    setModalOpen(true);
  };

  const openEditModal = (deal: AdminDeal) => {
    setEditingDeal(deal);
    setModalError(null);
    setProdSearch('');
    setSelectedProductId(deal.product?._id || '');
    setDealTitle(deal.title || 'Flash Deal');
    setDealDescription(deal.description || '');
    setDiscountType(deal.discountType);
    setDiscountPercentVal(deal.discountPercent);
    setDealPriceVal(deal.dealPrice);
    setCustomBadge(deal.dealBadge || `-${deal.discountPercent}%`);
    setStartsAtVal(toLocalDateTimeString(new Date(deal.startsAt)));
    setEndsAtVal(toLocalDateTimeString(new Date(deal.endsAt)));
    setDealStockLimitVal(deal.dealStockLimit || 0);
    setIsActiveVal(deal.isActive);
    setModalOpen(true);
  };

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setModalError('Please select a product for this deal.');
      return;
    }
    if (!endsAtVal) {
      setModalError('Please select a valid expiration date and time.');
      return;
    }

    const startDate = new Date(startsAtVal);
    const endDate = new Date(endsAtVal);

    if (endDate <= startDate) {
      setModalError('Deal expiration date must be after the start date.');
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      if (editingDeal) {
        await updateAdminDeal(editingDeal._id, {
          title: dealTitle.trim(),
          description: dealDescription.trim(),
          discountType,
          discountValue: discountType === 'percent' ? discountPercentVal : dealPriceVal,
          startsAt: startDate.toISOString(),
          endsAt: endDate.toISOString(),
          dealBadge: customBadge.trim() || `-${discountPercentVal}%`,
          dealStockLimit: Number(dealStockLimitVal) || 0,
          isActive: isActiveVal,
        });
        setSuccessMsg('Deal updated successfully.');
      } else {
        await createAdminDeal({
          productId: selectedProductId,
          title: dealTitle.trim(),
          description: dealDescription.trim(),
          discountType,
          discountValue: discountType === 'percent' ? discountPercentVal : dealPriceVal,
          startsAt: startDate.toISOString(),
          endsAt: endDate.toISOString(),
          dealBadge: customBadge.trim() || `-${discountPercentVal}%`,
          dealStockLimit: Number(dealStockLimitVal) || 0,
          isActive: isActiveVal,
        });
        setSuccessMsg('Flash deal scheduled successfully.');
      }
      setModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to save deal.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDeal = async (deal: AdminDeal) => {
    try {
      await toggleAdminDeal(deal._id, !deal.isActive);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle deal status.');
    }
  };

  const handleDeleteDeal = async (deal: AdminDeal) => {
    const confirm = window.confirm(
      `Are you sure you want to delete the deal for "${deal.product?.name || 'this product'}"? The product will immediately revert to its regular price.`
    );
    if (!confirm) return;

    try {
      await deleteAdminDeal(deal._id);
      await loadData();
      setSuccessMsg('Deal deleted successfully. Regular price restored.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deal.');
    }
  };

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (activeTab !== 'all' && d.status !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const prodName = d.product?.name?.toLowerCase() || '';
        const prodCat = d.product?.category?.toLowerCase() || '';
        const title = d.title?.toLowerCase() || '';
        return prodName.includes(q) || prodCat.includes(q) || title.includes(q);
      }
      return true;
    });
  }, [deals, activeTab, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = deals.length;
    const active = deals.filter((d) => d.status === 'active').length;
    const scheduled = deals.filter((d) => d.status === 'scheduled').length;
    const expired = deals.filter((d) => d.status === 'expired').length;
    const soldOut = deals.filter((d) => d.status === 'sold_out').length;
    const disabled = deals.filter((d) => d.status === 'disabled').length;
    return { total, active, scheduled, expired, soldOut, disabled };
  }, [deals]);

  // Filtered Products for Picker
  const filteredModalProducts = useMemo(() => {
    if (!prodSearch.trim()) return products;
    const q = prodSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
    );
  }, [products, prodSearch]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">
              Flash Deals & Time-Bound Sales
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700">
              <Flame className="w-3.5 h-3.5" />
              Live Promotion
            </span>
          </div>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Configure dynamic flash deals, discount badges, and automated countdown timers across harvest products.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void loadData()}
            className="p-2 rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
            title="Refresh Deals"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#15472B] hover:bg-[#0D331E] text-white text-[13px] font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Flash Deal</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[13px]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#64748B] uppercase tracking-wider">Total Deals</span>
            <Tag className="w-4 h-4 text-[#94A3B8]" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2">{stats.total}</div>
          <div className="text-[11px] text-[#94A3B8] mt-1">Configured campaigns</div>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Now
            </span>
            <Flame className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{stats.active}</div>
          <div className="text-[11px] text-emerald-600 mt-1">Live on storefront</div>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-blue-700 uppercase tracking-wider">Scheduled</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-2">{stats.scheduled}</div>
          <div className="text-[11px] text-blue-600 mt-1">Future start times</div>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#64748B] uppercase tracking-wider">Past / Sold Out</span>
            <Calendar className="w-4 h-4 text-[#94A3B8]" />
          </div>
          <div className="text-2xl font-bold text-[#64748B] mt-2">{stats.expired + stats.soldOut}</div>
          <div className="text-[11px] text-[#94A3B8] mt-1">Reverted to base price</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {(
              [
                { id: 'all', label: 'All Deals', count: stats.total },
                { id: 'active', label: 'Active', count: stats.active },
                { id: 'scheduled', label: 'Scheduled', count: stats.scheduled },
                { id: 'sold_out', label: 'Sold Out', count: stats.soldOut },
                { id: 'expired', label: 'Expired', count: stats.expired },
                { id: 'disabled', label: 'Disabled', count: stats.disabled },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#15472B] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-semibold ${
                      active ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product or deal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:bg-white focus:border-[#15472B] transition-colors"
            />
          </div>
        </div>

        {/* Deals Table */}
        {loading && deals.length === 0 ? (
          <div className="p-12 text-center text-[#64748B]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#15472B]" />
            <p className="text-[13px]">Loading promotional deals...</p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="p-12 text-center text-[#64748B]">
            <Tag className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
            <h3 className="text-[15px] font-semibold text-[#0F172A]">No deals found</h3>
            <p className="text-[13px] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'No promotions match your search criteria. Try a different search term.'
                : 'No flash deals in this filter. Click "Create Flash Deal" to schedule a promotion.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]/75 text-[11.5px] uppercase tracking-wider text-[#64748B] font-semibold">
                  <th className="py-3 px-4">Product & Deal</th>
                  <th className="py-3 px-4">Badge</th>
                  <th className="py-3 px-4">Pricing</th>
                  <th className="py-3 px-4">Timeframe</th>
                  <th className="py-3 px-4">Stock / Quota</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
                {filteredDeals.map((deal) => {
                  const prod = deal.product;
                  const original = deal.originalPrice || prod?.price || 0;
                  const dealPrice = deal.dealPrice;
                  const savings = original - dealPrice;
                  const timeNote = getTimeRemaining(deal.startsAt, deal.endsAt, deal.status);

                  return (
                    <tr key={deal._id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      {/* Product Thumbnail & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 rounded-md border border-[#E2E8F0] bg-[#FAF8F5] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={resolveMediaUrl(prod?.image)}
                              alt={prod?.name || 'Product'}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-[#0F172A] hover:text-[#15472B]">
                              {prod?.name || 'Unknown Product'}
                            </div>
                            <div className="text-[11.5px] text-[#64748B] flex items-center gap-2 mt-0.5">
                              <span className="capitalize">{prod?.category || 'General'}</span>
                              <span>•</span>
                              <span className="text-[#0F172A] font-medium">{deal.title}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Outlined Discount Badge (Exactly matching user reference image media_1795267306479_60525ad2.png) */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block border border-[#D03B3B] text-[#D03B3B] bg-white text-[12px] font-bold px-2 py-0.5 tracking-tight shadow-2xs">
                          {deal.dealBadge || `-${deal.discountPercent}%`}
                        </span>
                      </td>

                      {/* Pricing Details */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-[#15472B] text-[14px]">
                            {formatPKR(dealPrice)}
                          </span>
                          <span className="text-[12px] text-[#94A3B8] line-through">
                            {formatPKR(original)}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                          Save {formatPKR(savings)} ({deal.discountPercent}% off)
                        </div>
                      </td>

                      {/* Timeframe & Countdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[#0F172A] font-medium text-[12px]">
                          <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>{timeNote}</span>
                        </div>
                        <div className="text-[11px] text-[#94A3B8] mt-0.5">
                          {formatDateTime(deal.startsAt)} → {formatDateTime(deal.endsAt)}
                        </div>
                      </td>

                      {/* Stock / Quota Progress */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {deal.dealStockLimit > 0 ? (
                          <div className="w-28">
                            <div className="flex justify-between text-[11px] text-[#64748B] mb-1">
                              <span>Sold: {deal.dealSoldCount}</span>
                              <span>Max: {deal.dealStockLimit}</span>
                            </div>
                            <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#15472B] h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (deal.dealSoldCount / deal.dealStockLimit) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[12px] text-[#64748B] italic">
                            Unlimited ({deal.dealSoldCount} sold)
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {deal.status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Now
                          </span>
                        )}
                        {deal.status === 'scheduled' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3" />
                            Scheduled
                          </span>
                        )}
                        {deal.status === 'sold_out' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Sold Out
                          </span>
                        )}
                        {deal.status === 'expired' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Expired
                          </span>
                        )}
                        {deal.status === 'disabled' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200">
                            Disabled
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Switch */}
                          <button
                            onClick={() => void handleToggleDeal(deal)}
                            className={`p-1.5 rounded-md border transition-colors ${
                              deal.isActive
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                            title={deal.isActive ? 'Deactivate Deal' : 'Activate Deal'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(deal)}
                            className="p-1.5 rounded-md border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                            title="Edit Deal"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => void handleDeleteDeal(deal)}
                            className="p-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Deal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Deal Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#E2E8F0] my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-[17px] font-bold text-[#0F172A]">
                  {editingDeal ? 'Edit Flash Deal' : 'Create New Flash Deal'}
                </h3>
                <p className="text-[12.5px] text-[#64748B] mt-0.5">
                  Original product price will stay preserved. Active deal will apply real-time discount across storefront.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveDeal} className="p-6 space-y-5">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[12.5px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Product Selector */}
              <div>
                <label className="block text-[12.5px] font-semibold text-[#0F172A] mb-1.5">
                  Target Product <span className="text-red-500">*</span>
                </label>
                {editingDeal ? (
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center gap-3">
                    <div className="w-10 h-12 bg-white border border-[#E2E8F0] rounded p-1 flex items-center justify-center shrink-0">
                      <img
                        src={resolveMediaUrl(editingDeal.product?.image)}
                        alt={editingDeal.product?.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-[#0F172A] text-[13.5px]">
                        {editingDeal.product?.name}
                      </div>
                      <div className="text-[11.5px] text-[#64748B]">
                        Original Base Price: {formatPKR(editingDeal.originalPrice)} (Preserved)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Search inside product dropdown */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search product from catalog..."
                        value={prodSearch}
                        onChange={(e) => setProdSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-[12.5px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:bg-white focus:border-[#15472B]"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-[#E2E8F0] rounded-lg divide-y divide-[#E2E8F0] bg-white">
                      {filteredModalProducts.length === 0 ? (
                        <div className="p-4 text-center text-[12.5px] text-[#64748B]">
                          No products found.
                        </div>
                      ) : (
                        filteredModalProducts.map((p) => {
                          const isSel = p._id === selectedProductId;
                          return (
                            <div
                              key={p._id}
                              onClick={() => handleProductSelect(p)}
                              className={`p-2.5 flex items-center gap-3 cursor-pointer transition-colors ${
                                isSel
                                  ? 'bg-[#15472B]/5 border-l-4 border-l-[#15472B]'
                                  : 'hover:bg-[#F8FAFC]'
                              }`}
                            >
                              <div className="w-9 h-11 bg-[#FAF8F5] border border-[#E2E8F0] rounded p-0.5 flex items-center justify-center shrink-0">
                                <img
                                  src={resolveMediaUrl(p.image)}
                                  alt={p.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold text-[#0F172A] truncate">
                                  {p.name}
                                </div>
                                <div className="text-[11px] text-[#64748B] flex items-center gap-2">
                                  <span>{p.category}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-[#15472B]">
                                    Base Price: {formatPKR(p.price)}
                                  </span>
                                </div>
                              </div>
                              {isSel && (
                                <CheckCircle2 className="w-4 h-4 text-[#15472B] shrink-0" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Deal Pricing (Live Dual-Calculation) */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-[#15472B]" />
                    Dual Pricing Calculator
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Original Price: <strong className="text-[#0F172A]">{formatPKR(selectedProduct?.price || 0)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Discount Percentage */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] mb-1">
                      Discount Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={discountPercentVal}
                        onChange={(e) => handlePercentChange(Number(e.target.value))}
                        className="w-full pl-3 pr-8 py-2 text-[14px] font-bold text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#15472B]"
                        placeholder="13"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#64748B]">
                        %
                      </span>
                    </div>
                    <span className="text-[10.5px] text-[#94A3B8] mt-1 block">
                      e.g. 13% discount
                    </span>
                  </div>

                  {/* Deal Price in PKR */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] mb-1">
                      Calculated Deal Price (PKR)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={selectedProduct ? selectedProduct.price - 1 : 999999}
                        value={dealPriceVal}
                        onChange={(e) => handleDealPriceChange(Number(e.target.value))}
                        className="w-full pl-10 pr-3 py-2 text-[14px] font-bold text-[#15472B] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#15472B]"
                        placeholder="3000"
                        required
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#64748B]">
                        Rs.
                      </span>
                    </div>
                    <span className="text-[10.5px] text-[#94A3B8] mt-1 block">
                      Buyer pays this amount
                    </span>
                  </div>
                </div>

                {/* Live Preview Box */}
                {selectedProduct && (
                  <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-[#64748B]">Customer Preview:</div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-[15px] font-bold text-[#15472B]">
                          {formatPKR(dealPriceVal)}
                        </span>
                        <span className="text-[12px] text-[#94A3B8] line-through">
                          {formatPKR(selectedProduct.price)}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          (Save {formatPKR(selectedProduct.price - dealPriceVal)})
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10.5px] text-[#64748B] mb-1">Card Badge Preview:</div>
                      {/* Red outlined rectangular badge matching reference image */}
                      <span className="border border-[#D03B3B] text-[#D03B3B] bg-white text-[12px] font-bold px-2 py-0.5 tracking-tight">
                        {customBadge || `-${discountPercentVal}%`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Badge Override */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#0F172A] mb-1">
                    Deal Title
                  </label>
                  <input
                    type="text"
                    value={dealTitle}
                    onChange={(e) => setDealTitle(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:bg-white focus:border-[#15472B]"
                    placeholder="Flash Deal"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#0F172A] mb-1">
                    Badge Text Override
                  </label>
                  <input
                    type="text"
                    value={customBadge}
                    onChange={(e) => setCustomBadge(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:bg-white focus:border-[#15472B]"
                    placeholder={`-${discountPercentVal}%`}
                  />
                </div>
              </div>

              {/* Date & Time Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#0F172A] mb-1">
                    Starts At (Start Promotion)
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAtVal}
                    onChange={(e) => setStartsAtVal(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:bg-white focus:border-[#15472B]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#0F172A] mb-1">
                    Expires At (Automated Revert) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endsAtVal}
                    onChange={(e) => setEndsAtVal(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:bg-white focus:border-[#15472B]"
                    required
                  />
                </div>
              </div>

              {/* Deal Stock Quota & Active Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-[12px] font-medium text-[#0F172A] mb-1">
                    Deal Stock Limit / Quota (Units)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dealStockLimitVal}
                    onChange={(e) => setDealStockLimitVal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-[13px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:bg-white focus:border-[#15472B]"
                    placeholder="0 = Unlimited during timeframe"
                  />
                  <span className="text-[10.5px] text-[#94A3B8] mt-1 block">
                    Set 0 for unlimited orders during promotional hours.
                  </span>
                </div>

                <div className="pt-2 sm:pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActiveVal}
                      onChange={(e) => setIsActiveVal(e.target.checked)}
                      className="w-4 h-4 rounded text-[#15472B] focus:ring-[#15472B]"
                    />
                    <span className="text-[13px] font-medium text-[#0F172A]">
                      Deal Active
                    </span>
                  </label>
                  <span className="text-[11px] text-[#64748B] block mt-0.5">
                    Unchecking will immediately disable discount without deleting record.
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 bg-[#F8FAFC] -mx-6 -mb-6 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#15472B] hover:bg-[#0D331E] text-white text-[13px] font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingDeal ? 'Update Deal' : 'Schedule Deal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
