import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdminCoupon>>(EMPTY_COUPON);
  const [saving, setSaving] = useState(false);

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

  const handleDelete = async (coupon: AdminCoupon) => {
    try {
      await deleteAdminCoupon(coupon._id);
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete coupon.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-[#0F172A]">
            Harvest Coupons &amp; Promos
          </h2>
          <p className="text-[13px] text-[#64748B]">
            Manage percentage and flat PKR discount codes validated at storefront checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-[#15472B] hover:bg-[#0F3620] text-white px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.07em] inline-flex items-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {error && (
        <div className="border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
          {error}
        </div>
      )}

      <div className="bg-white border border-[#E2E8F0] overflow-x-auto">
        {loading && coupons.length === 0 ? (
          <div className="p-8 text-center text-[13.5px] text-[#64748B]">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-[14px] text-[#64748B]">
            No coupons created yet. Create a harvest promo code such as ZAITOON10.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-3 px-4 text-left font-semibold">Code</th>
                <th className="py-3 px-4 text-left font-semibold">Discount</th>
                <th className="py-3 px-4 text-right font-semibold">Min Order</th>
                <th className="py-3 px-4 text-right font-semibold">Usage</th>
                <th className="py-3 px-4 text-left font-semibold">Expires</th>
                <th className="py-3 px-4 text-left font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {coupons.map((c) => (
                <tr key={c._id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-4">
                    <span className="font-mono-data font-semibold text-[#15472B]">
                      {c.code}
                    </span>
                    {c.description && (
                      <p className="text-[11.5px] text-[#64748B] truncate max-w-[240px]">
                        {c.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono-data text-[#0F172A]">
                    {c.discountType === 'percentage'
                      ? `${c.discountValue}% off`
                      : `${formatPKR(c.discountValue)} off`}
                    {c.maxDiscountAmount ? ` (max ${formatPKR(c.maxDiscountAmount)})` : ''}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-data text-[#475569]">
                    {c.minOrderAmount > 0 ? formatPKR(c.minOrderAmount) : 'None'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-data text-[#0F172A]">
                    {c.usedCount} / {c.usageLimit ?? '∞'}
                  </td>
                  <td className="py-3 px-4 font-mono-data text-[#475569]">
                    {c.expiresAt ? formatDate(c.expiresAt) : 'No expiry'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => void handleToggle(c)}
                      className={`text-[12px] font-semibold cursor-pointer ${
                        c.isActive ? 'text-[#16A34A]' : 'text-[#64748B]'
                      }`}
                    >
                      {c.isActive ? 'Active (Click to pause)' : 'Paused (Click to enable)'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        aria-label={`Edit ${c.code}`}
                        className="p-1.5 border border-[#CBD5E1] hover:border-[#0F172A] text-[#334155] cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(c)}
                        aria-label={`Delete ${c.code}`}
                        className="p-1.5 border border-[#FECACA] hover:bg-[#FEF2F2] text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[520px] bg-white border border-[#E2E8F0]">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-[17px] font-semibold text-[#0F172A]">
                {editingId ? 'Edit Coupon' : 'Create Harvest Coupon'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    required
                    value={form.code ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="HARVEST500"
                    className="w-full border border-[#CBD5E1] px-3 py-2 font-mono-data uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Discount Type
                  </label>
                  <select
                    value={form.discountType ?? 'percentage'}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, discountType: e.target.value as DiscountType }))
                    }
                    className="w-full border border-[#CBD5E1] bg-white px-3 py-2"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat PKR (Rs.)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.discountValue ?? 10}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, discountValue: Number(e.target.value) }))
                    }
                    className="w-full border border-[#CBD5E1] px-3 py-2 font-mono-data"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Min Order (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.minOrderAmount ?? 0}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, minOrderAmount: Number(e.target.value) }))
                    }
                    className="w-full border border-[#CBD5E1] px-3 py-2 font-mono-data"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.usageLimit ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        usageLimit: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    placeholder="Unlimited"
                    className="w-full border border-[#CBD5E1] px-3 py-2 font-mono-data"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Max Cap (PKR, Optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxDiscountAmount ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        maxDiscountAmount: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full border border-[#CBD5E1] px-3 py-2 font-mono-data"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={(form.expiresAt as string) ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value || null }))}
                    className="w-full border border-[#CBD5E1] px-3 py-2 font-mono-data"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Rs. 500 off orders above Rs. 4,000"
                  className="w-full border border-[#CBD5E1] px-3 py-2"
                />
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.isActive)}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="accent-[#15472B]"
                />
                <span>Coupon is active</span>
              </label>

              <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-[#CBD5E1] px-4 py-2 text-[12px] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#15472B] hover:bg-[#0F3620] text-white px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.07em] cursor-pointer"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
