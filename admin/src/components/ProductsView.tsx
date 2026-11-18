import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Upload, X, Edit2 } from 'lucide-react';
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  resolveAssetUrl,
  updateAdminProduct,
  updateProductStock,
  uploadAdminImage,
} from '../services/adminApi';
import type { AdminProduct, BrandName } from '../types/admin';
import { formatPKR } from '../utils/formatters';

const BRAND_OPTIONS: BrandName[] = [
  'Zaitoon Reserve',
  'Chakwal Press',
  'Himalayan Sidr',
  'Verdant Grove',
];

const SECTION_OPTIONS = ['featured-grid', 'best-sellers', 'unique', 'shop'];

const EMPTY_FORM: Partial<AdminProduct> = {
  name: '',
  slug: '',
  sku: '',
  brand: 'Zaitoon Reserve',
  category: 'Olive Oil',
  flavour: '',
  origin: 'Potohar',
  price: 2200,
  originalPrice: undefined,
  stock: 36,
  size: '500 ml Dark Glass',
  description: '',
  image: '',
  tag: '',
  sections: ['shop'],
  extractionMethod: 'First Cold-Press (< 27°C), Unfiltered',
  acidityLevel: '< 0.3% Free Fatty Acidity',
  isSale: false,
  isNew: false,
  isActive: true,
};

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');

  // Stock quick edit
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdminProduct>>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAdminProducts({
        search: search.trim() || undefined,
        brand: brandFilter !== 'All' ? brandFilter : undefined,
      });
      setProducts(list);
      const nextDrafts: Record<string, string> = {};
      list.forEach((p) => {
        nextDrafts[p._id] = String(p.stock ?? 0);
      });
      setStockDrafts(nextDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandFilter]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (prod: AdminProduct) => {
    setEditingId(prod._id);
    setForm({
      ...prod,
      sections: prod.sections?.length ? prod.sections : ['shop'],
    });
    setModalOpen(true);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadAdminImage(file);
      setForm((prev) => ({ ...prev, image: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.image?.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const generatedSlug =
        form.slug?.trim() ||
        form.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      const payload: Partial<AdminProduct> = {
        ...form,
        slug: generatedSlug,
        sku: form.sku?.trim().toUpperCase() || `ZP-${Date.now().toString().slice(-4)}`,
        price: Number(form.price || 0),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock: Number(form.stock ?? 0),
      };

      if (editingId) {
        await updateAdminProduct(editingId, payload);
      } else {
        await createAdminProduct(payload);
      }
      setModalOpen(false);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStock = async (prodId: string) => {
    const val = Number(stockDrafts[prodId]);
    if (Number.isNaN(val) || val < 0) return;
    setSavingStockId(prodId);
    try {
      await updateProductStock(prodId, val);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stock update failed.');
    } finally {
      setSavingStockId(null);
    }
  };

  const handleDelete = async (prod: AdminProduct) => {
    setError(null);
    try {
      await deleteAdminProduct(prod._id);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to delete ${prod.name}.`);
    }
  };

  const toggleSection = (sec: string) => {
    setForm((prev) => {
      const current = prev.sections ?? [];
      return {
        ...prev,
        sections: current.includes(sec)
          ? current.filter((s) => s !== sec)
          : [...current, sec],
      };
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-[#0F172A]">
            Products &amp; Harvest Inventory
          </h2>
          <p className="text-[13px] text-[#64748B] font-mono-data">
            {products.length} catalog items
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="bg-[#15472B] hover:bg-[#0F3620] text-white px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.07em] inline-flex items-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E2E8F0] p-4 flex flex-wrap items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void loadProducts();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, SKU, category..."
              className="w-[230px] border border-[#CBD5E1] px-3 py-1.5 pr-8 text-[13px] focus:outline-none focus:border-[#15472B]"
            />
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            className="border border-[#0F172A] px-3 py-1.5 text-[12px] font-medium cursor-pointer"
          >
            Find
          </button>
        </form>

        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="border border-[#CBD5E1] bg-white px-3 py-1.5 text-[12.5px]"
        >
          <option value="All">All Orchard Brands</option>
          {BRAND_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] overflow-x-auto">
        {loading && products.length === 0 ? (
          <div className="p-8 text-center text-[13.5px] text-[#64748B]">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-[14px] text-[#64748B]">
            No products found.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-3 px-4 text-left font-semibold">Product</th>
                <th className="py-3 px-4 text-left font-semibold">Brand &amp; Category</th>
                <th className="py-3 px-4 text-left font-semibold">Sections</th>
                <th className="py-3 px-4 text-right font-semibold">Price (PKR)</th>
                <th className="py-3 px-4 text-right font-semibold">Stock</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {products.map((prod) => (
                <tr key={prod._id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveAssetUrl(prod.image)}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-12 object-cover bg-[#FAF3F0] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-[#0F172A] truncate max-w-[220px]">
                          {prod.name}
                        </p>
                        <p className="text-[11px] text-[#64748B] font-mono-data">
                          {prod.sku} · {prod.size}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-[#0F172A]">{prod.brand}</p>
                    <p className="text-[11.5px] text-[#64748B]">
                      {prod.category}
                      {prod.origin ? ` · ${prod.origin}` : ''}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-[12px] text-[#475569]">
                    {(prod.sections ?? []).join(', ') || 'shop'}
                    {!prod.isActive && (
                      <span className="block text-[11px] text-[#DC2626] font-medium">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-data">
                    <span className="font-semibold text-[#0F172A]">{formatPKR(prod.price)}</span>
                    {prod.originalPrice && (
                      <span className="block text-[11px] text-[#64748B] line-through">
                        {formatPKR(prod.originalPrice)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        value={stockDrafts[prod._id] ?? String(prod.stock)}
                        onChange={(e) =>
                          setStockDrafts((prev) => ({ ...prev, [prod._id]: e.target.value }))
                        }
                        aria-label={`Stock for ${prod.name}`}
                        className={`w-16 border px-2 py-1 text-right font-mono-data text-[12.5px] ${
                          prod.stock <= 5
                            ? 'border-[#FCA5A5] text-[#DC2626]'
                            : 'border-[#CBD5E1] text-[#0F172A]'
                        }`}
                      />
                      <button
                        type="button"
                        disabled={savingStockId === prod._id}
                        onClick={() => void handleSaveStock(prod._id)}
                        className="border border-[#CBD5E1] hover:border-[#15472B] px-2 py-1 text-[11px] font-medium cursor-pointer"
                      >
                        {savingStockId === prod._id ? '...' : 'Set'}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(prod)}
                        aria-label={`Edit ${prod.name}`}
                        className="p-1.5 border border-[#CBD5E1] hover:border-[#0F172A] text-[#334155] cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(prod)}
                        aria-label={`Delete ${prod.name}`}
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[700px] max-h-[90vh] bg-white border border-[#E2E8F0] flex flex-col">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-[17px] font-semibold text-[#0F172A]">
                {editingId ? 'Edit Harvest Product' : 'Add New Harvest Product'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4 text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full border border-[#CBD5E1] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={form.sku ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                    placeholder="e.g. ZP-EVOO-500"
                    className="w-full border border-[#CBD5E1] px-3 py-2 font-mono-data uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Brand
                  </label>
                  <select
                    value={form.brand ?? 'Zaitoon Reserve'}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, brand: e.target.value as BrandName }))
                    }
                    className="w-full border border-[#CBD5E1] bg-white px-3 py-2"
                  >
                    {BRAND_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={form.category ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    placeholder="Bottled, Cooking, Raw Honey..."
                    className="w-full border border-[#CBD5E1] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Pack Size
                  </label>
                  <input
                    type="text"
                    required
                    value={form.size ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))}
                    placeholder="500 ml Dark Glass"
                    className="w-full border border-[#CBD5E1] px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Price (PKR)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.price ?? 0}
                    onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full border border-[#CBD5E1] px-3 py-2 font-mono-data"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Original Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.originalPrice ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        originalPrice: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className="w-full border border-[#CBD5E1] px-3 py-2 font-mono-data"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.stock ?? 0}
                    onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                    className="w-full border border-[#CBD5E1] px-3 py-2 font-mono-data"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Origin
                  </label>
                  <input
                    type="text"
                    value={form.origin ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))}
                    placeholder="Potohar / Swat"
                    className="w-full border border-[#CBD5E1] px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Flavour (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.flavour ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, flavour: e.target.value }))}
                    placeholder="Basil, Pepper, Cardamom, Ginger"
                    className="w-full border border-[#CBD5E1] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                    Acidity Level
                  </label>
                  <input
                    type="text"
                    value={form.acidityLevel ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, acidityLevel: e.target.value }))}
                    className="w-full border border-[#CBD5E1] px-3 py-2"
                  />
                </div>
              </div>

              {/* Image Upload + URL */}
              <div className="border border-[#E2E8F0] p-3.5 bg-[#F8FAFC] space-y-2.5">
                <label className="block text-[11px] uppercase font-semibold text-[#475569]">
                  Product Studio Image (Upload or URL)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 border border-[#0F172A] bg-white px-3.5 py-2 text-[12px] font-medium cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => void handleUploadFile(e)}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    required
                    value={form.image ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                    placeholder="/uploads/bottle.jpg or https://..."
                    className="flex-1 min-w-[200px] border border-[#CBD5E1] bg-white px-3 py-2 font-mono-data text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold text-[#475569] mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.description ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full border border-[#CBD5E1] px-3 py-2"
                />
              </div>

              <div className="space-y-2">
                <p className="text-[11px] uppercase font-semibold text-[#475569]">
                  Storefront Sections
                </p>
                <div className="flex flex-wrap gap-4">
                  {SECTION_OPTIONS.map((sec) => (
                    <label key={sec} className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(form.sections ?? []).includes(sec)}
                        onChange={() => toggleSection(sec)}
                        className="accent-[#15472B]"
                      />
                      <span>{sec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-5 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isActive)}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="accent-[#15472B]"
                  />
                  <span>Active on Storefront</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isSale)}
                    onChange={(e) => setForm((p) => ({ ...p, isSale: e.target.checked }))}
                    className="accent-[#15472B]"
                  />
                  <span>On Sale</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isNew)}
                    onChange={(e) => setForm((p) => ({ ...p, isNew: e.target.checked }))}
                    className="accent-[#15472B]"
                  />
                  <span>New Harvest</span>
                </label>
              </div>

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
                  disabled={submitting}
                  className="bg-[#15472B] hover:bg-[#0F3620] text-white px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.07em] cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
