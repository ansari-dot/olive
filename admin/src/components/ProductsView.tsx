import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Trash2, Upload, X, Edit2 } from 'lucide-react';
import {
  DEFAULT_IMAGE_PLACEHOLDER,
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminCategories,
  fetchAdminOrigins,
  fetchAdminProducts,
  resolveAssetUrl,
  updateAdminProduct,
  updateProductStock,
  uploadAdminImage,
} from '../services/adminApi';
import type { AdminProduct, BrandName } from '../types/admin';
import { formatPKR } from '../utils/formatters';

const BRAND_OPTIONS: BrandName[] = [
  'Pak Veda',
  'Pak Veda Reserve',
  'Pak Veda Organics',
  'Pak Veda Botanicals',
  'Zaitoon Reserve',
  'Chakwal Press',
  'Himalayan Sidr',
  'Verdant Grove',
];

const SECTION_OPTIONS = ['featured-grid', 'best-sellers', 'unique', 'shop'];

interface AdminCategoryOption {
  name: string;
  slug: string;
  categoryNumber?: number;
  department?: string;
  subcategories?: { name: string; slug?: string }[];
}

const EMPTY_FORM: Partial<AdminProduct> = {
  name: '',
  slug: '',
  sku: '',
  brand: 'Pak Veda',
  category: 'Olive Products',
  subcategory: '',
  flavour: '',
  origin: 'Potohar',
  price: 2200,
  originalPrice: undefined,
  stock: 36,
  size: '500 ml Dark Glass',
  description: '',
  detailedDescription: '',
  ingredients: '',
  harvestDate: '',
  storageInstructions: '',
  image: '',
  galleryImages: [],
  tag: '',
  sections: ['shop', 'featured-grid'],
  extractionMethod: 'First Cold-Press (< 27°C), Unfiltered',
  acidityLevel: '< 0.3% Free Fatty Acidity',
  isSale: false,
  isNew: false,
  isOrganic: false,
  isActive: true,
};

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categoriesList, setCategoriesList] = useState<AdminCategoryOption[]>([]);
  const [originsList, setOriginsList] = useState<Array<{ name: string; region?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [subcategoryFilter, setSubcategoryFilter] = useState('All');
  const [originFilter, setOriginFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');

  // Stock quick edit
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdminProduct>>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refreshTaxonomies = () => {
    fetchAdminCategories()
      .then((cats) => {
        if (Array.isArray(cats)) setCategoriesList(cats);
      })
      .catch((err) => console.error('Failed to load categories:', err));

    fetchAdminOrigins()
      .then((origs) => {
        if (Array.isArray(origs)) setOriginsList(origs);
      })
      .catch((err) => console.error('Failed to load origins:', err));
  };

  useEffect(() => {
    refreshTaxonomies();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAdminProducts({
        search: search.trim() || undefined,
        brand: brandFilter !== 'All' ? brandFilter : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        subcategory: subcategoryFilter !== 'All' ? subcategoryFilter : undefined,
        section: sectionFilter !== 'All' ? sectionFilter : undefined,
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
  }, [brandFilter, categoryFilter, subcategoryFilter, sectionFilter]);

  const openCreateModal = () => {
    refreshTaxonomies();
    setEditingId(null);
    setForm(EMPTY_FORM);
    setNewGalleryUrl('');
    setModalOpen(true);
  };

  const openEditModal = (prod: AdminProduct) => {
    refreshTaxonomies();
    setEditingId(prod._id);
    setForm({
      ...prod,
      sections: prod.sections?.length ? prod.sections : ['shop', 'featured-grid'],
      galleryImages: prod.galleryImages?.length ? prod.galleryImages : [],
      extractionMethod: prod.extractionMethod || 'First Cold-Press (< 27°C), Unfiltered',
      acidityLevel: prod.acidityLevel || '< 0.3% Free Fatty Acidity',
      detailedDescription: prod.detailedDescription || '',
      ingredients: prod.ingredients || '',
      harvestDate: prod.harvestDate || '',
      storageInstructions: prod.storageInstructions || '',
      isOrganic: Boolean(prod.isOrganic),
    });
    setNewGalleryUrl('');
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

  const handleUploadGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGallery(true);
    setError(null);
    try {
      const url = await uploadAdminImage(file);
      setForm((prev) => ({
        ...prev,
        galleryImages: [...(prev.galleryImages || []), url],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gallery image upload failed.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleAddGalleryUrl = () => {
    const trimmed = newGalleryUrl.trim();
    if (!trimmed) return;
    setForm((prev) => ({
      ...prev,
      galleryImages: [...(prev.galleryImages || []), trimmed],
    }));
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setForm((prev) => ({
      ...prev,
      galleryImages: (prev.galleryImages || []).filter((_, idx) => idx !== indexToRemove),
    }));
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
        name: form.name?.trim(),
        slug: generatedSlug,
        sku: form.sku?.trim().toUpperCase() || `ZP-${Date.now().toString().slice(-4)}`,
        brand: form.brand || 'Pak Veda',
        category: form.category || 'Olive Products',
        subcategory: form.subcategory?.trim() || '',
        origin: form.origin || 'Potohar',
        size: form.size || '500 ml Dark Glass',
        price: Number(form.price || 0),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock: Number(form.stock ?? 0),
        extractionMethod: form.extractionMethod?.trim() || 'First Cold-Press (< 27°C), Unfiltered',
        acidityLevel: form.acidityLevel?.trim() || '< 0.3% Free Fatty Acidity',
        flavour: form.flavour?.trim() || undefined,
        description: form.description?.trim() || '',
        image: form.image?.trim() || '',
        galleryImages: (form.galleryImages || []).filter((img) => typeof img === 'string' && img.trim().length > 0),
        sections: form.sections?.length ? form.sections : ['shop', 'featured-grid'],
        isActive: form.isActive !== undefined ? Boolean(form.isActive) : true,
        isSale: Boolean(form.isSale),
        isNew: Boolean(form.isNew),
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

  const displayedProducts = useMemo(() => {
    if (originFilter === 'All') return products;
    return products.filter((p) => p.origin === originFilter);
  }, [products, originFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-[#0F172A]">
            Products &amp; Harvest Inventory
          </h2>
          <p className="text-[13px] text-[#64748B] font-mono-data">
            {displayedProducts.length} catalog items
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

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setSubcategoryFilter('All');
            }}
            className="border border-[#CBD5E1] bg-white px-3 py-1.5 text-[12.5px] max-w-[200px]"
          >
            <option value="All">All Categories (28)</option>
            {categoriesList.map((c) => (
              <option key={c.slug || c.name} value={c.name}>
                {c.categoryNumber ? `${c.categoryNumber}. ` : ''}{c.name}
              </option>
            ))}
          </select>

          {categoryFilter !== 'All' && (
            <select
              value={subcategoryFilter}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
              className="border border-[#CBD5E1] bg-white px-3 py-1.5 text-[12.5px] max-w-[200px]"
            >
              <option value="All">All Subcategories</option>
              {categoriesList
                .find((c) => c.name === categoryFilter)
                ?.subcategories?.map((sc) => (
                  <option key={sc.slug || sc.name} value={sc.name}>
                    {sc.name}
                  </option>
                ))}
            </select>
          )}

          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="border border-[#CBD5E1] bg-white px-3 py-1.5 text-[12.5px]"
          >
            <option value="All">All Brands</option>
            {BRAND_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="border border-[#CBD5E1] bg-white px-3 py-1.5 text-[12.5px]"
          >
            <option value="All">All Storefront Sections</option>
            <option value="featured-grid">Featured Grid</option>
            <option value="best-sellers">Best Sellers</option>
            <option value="unique">Unique Products</option>
            <option value="shop">Main Shop</option>
          </select>

          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="border border-[#CBD5E1] bg-white px-3 py-1.5 text-[12.5px]"
          >
            <option value="All">All Origins</option>
            {originsList.map((o) => (
              <option key={o.name} value={o.name}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
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
              {displayedProducts.map((prod) => (
                <tr key={prod._id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveAssetUrl(prod.image)}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== DEFAULT_IMAGE_PLACEHOLDER) {
                            target.onerror = null;
                            target.src = DEFAULT_IMAGE_PLACEHOLDER;
                          }
                        }}
                        className="w-10 h-12 object-cover bg-[#FAF3F0] shrink-0 border border-[#E2E8F0]"
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
                    <p className="text-[#0F172A] font-medium">{prod.brand}</p>
                    <p className="text-[11.5px] text-[#64748B]">
                      {prod.category}
                      {prod.origin ? ` · ${prod.origin}` : ''}
                    </p>
                    {prod.subcategory && (
                      <span className="inline-block mt-1 text-[10.5px] px-1.5 py-0.5 bg-[#F1F5F9] text-[#1E293B] rounded border border-[#E2E8F0] font-mono-data max-w-[200px] truncate" title={prod.subcategory}>
                        {prod.subcategory}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[12px] text-[#475569]">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {(prod.sections ?? []).map((sec) => {
                        let color = 'bg-[#F1F5F9] text-[#475569]';
                        let label = sec;
                        if (sec === 'featured-grid') {
                          color = 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]';
                          label = 'Grid';
                        } else if (sec === 'best-sellers') {
                          color = 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]';
                          label = 'Best Seller';
                        } else if (sec === 'unique') {
                          color = 'bg-[#E0E7FF] text-[#3730A3] border border-[#C7D2FE]';
                          label = 'Unique';
                        } else if (sec === 'shop') {
                          color = 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]';
                          label = 'Shop';
                        }
                        return (
                          <span
                            key={sec}
                            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-xs tracking-tight ${color}`}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                    {!prod.isActive && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] bg-[#FEE2E2] text-[#DC2626] font-semibold uppercase">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[820px] max-h-[92vh] bg-white border border-[#E2E8F0] shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-[17px] font-semibold text-[#0F172A]">
                  {editingId ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-[12px] text-[#64748B]">
                  Manage product specifications, pricing, inventory, and storefront merchandising
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors cursor-pointer rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-[13px]">
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#15472B] border-b border-[#E2E8F0] pb-1.5">
                  1. Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Extra Virgin Olive Oil Reserve"
                      value={form.name || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      SKU Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ZP-500-EVOO"
                      value={form.sku || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-[#15472B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Brand */}
                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Brand
                    </label>
                    <select
                      value={form.brand || 'Pak Veda'}
                      onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#15472B]"
                    >
                      {BRAND_OPTIONS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.category || 'Olive Products'}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          category: newCat,
                          subcategory: '',
                        }));
                      }}
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#15472B]"
                    >
                      {categoriesList.length > 0 ? (
                        categoriesList.map((cat) => (
                          <option key={cat.slug || cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))
                      ) : (
                        <option value="Olive Products">Olive Products</option>
                      )}
                    </select>
                  </div>

                  {/* Subcategory */}
                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Subcategory
                    </label>
                    {(() => {
                      const matchedCat = categoriesList.find((c) => c.name === form.category);
                      const subcats = matchedCat?.subcategories || [];
                      if (subcats.length > 0) {
                        return (
                          <select
                            value={form.subcategory || ''}
                            onChange={(e) => setForm((prev) => ({ ...prev, subcategory: e.target.value }))}
                            className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#15472B]"
                          >
                            <option value="">-- None / General --</option>
                            {subcats.map((sub) => (
                              <option key={sub.name} value={sub.name}>
                                {sub.name}
                              </option>
                            ))}
                          </select>
                        );
                      }
                      return (
                        <input
                          type="text"
                          placeholder="e.g. Cold Pressed"
                          value={form.subcategory || ''}
                          onChange={(e) => setForm((prev) => ({ ...prev, subcategory: e.target.value }))}
                          className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                        />
                      );
                    })()}
                  </div>

                  {/* Origin */}
                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Origin / Terroir
                    </label>
                    <select
                      value={form.origin || 'Potohar'}
                      onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))}
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#15472B]"
                    >
                      {originsList.length > 0 ? (
                        originsList.map((org) => (
                          <option key={org.name} value={org.name}>
                            {org.name} {org.region ? `(${org.region})` : ''}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Potohar">Potohar</option>
                          <option value="Chakwal">Chakwal</option>
                          <option value="Balochistan">Balochistan</option>
                          <option value="Swat Valley">Swat Valley</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing & Packaging */}
              <div className="space-y-4">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#15472B] border-b border-[#E2E8F0] pb-1.5">
                  2. Pricing &amp; Packaging
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Price (PKR) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={50}
                      value={form.price ?? ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Original Price (PKR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      placeholder="Optional strike price"
                      value={form.originalPrice ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          originalPrice: e.target.value ? Number(e.target.value) : undefined,
                        }))
                      }
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Size / Packaging <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 500 ml Dark Glass"
                      value={form.size || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, size: e.target.value }))}
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Stock Inventory <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={form.stock ?? ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Quality & Extraction Specs */}
              <div className="space-y-4">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#15472B] border-b border-[#E2E8F0] pb-1.5">
                  3. Quality &amp; Extraction Specs
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Extraction Method
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. First Cold-Press (< 27°C), Unfiltered"
                      value={form.extractionMethod || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, extractionMethod: e.target.value }))}
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Acidity Level
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. < 0.3% Free Fatty Acidity"
                      value={form.acidityLevel || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, acidityLevel: e.target.value }))}
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Flavour Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Green Olive, Artichoke, Fresh Herb"
                      value={form.flavour || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, flavour: e.target.value }))}
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Ingredients &amp; Composition
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 100% Single-Estate Cold-Pressed Extra Virgin Olive Oil"
                      value={form.ingredients || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, ingredients: e.target.value }))}
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Harvest Season / Batch
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. November 2026 Batch #04"
                      value={form.harvestDate || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, harvestDate: e.target.value }))}
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Storage &amp; Care
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Store in a cool, dark pantry away from direct heat"
                      value={form.storageInstructions || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, storageInstructions: e.target.value }))}
                      className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Imagery */}
              <div className="space-y-4">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#15472B] border-b border-[#E2E8F0] pb-1.5">
                  4. Product Images
                </h4>

                {/* Primary Image */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Primary Image <span className="text-red-500">*</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] px-3 py-1.5 text-[12px] font-medium text-[#15472B] cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploading ? 'Uploading...' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadFile}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  <div className="flex gap-4 items-center">
                    <input
                      type="text"
                      required
                      placeholder="Paste image URL (e.g. /images/products/evoo.jpg or https://...)"
                      value={form.image || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                      className="flex-1 border border-[#CBD5E1] px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#15472B]"
                    />
                    <div className="w-14 h-14 border border-[#E2E8F0] bg-white shrink-0 overflow-hidden flex items-center justify-center">
                      <img
                        src={resolveAssetUrl(form.image)}
                        alt="Primary Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_IMAGE_PLACEHOLDER;
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Gallery Images */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#334155]">
                        Gallery Images ({(form.galleryImages || []).length})
                      </label>
                      <p className="text-[11px] text-[#64748B]">Additional angles and detail shots for the product page</p>
                    </div>
                    <label className="inline-flex items-center gap-1.5 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] px-3 py-1.5 text-[12px] font-medium text-[#15472B] cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingGallery ? 'Uploading...' : 'Upload to Gallery'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadGalleryFile}
                        disabled={uploadingGallery}
                      />
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste additional image URL..."
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddGalleryUrl();
                        }
                      }}
                      className="flex-1 border border-[#CBD5E1] px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#15472B]"
                    />
                    <button
                      type="button"
                      onClick={handleAddGalleryUrl}
                      className="bg-[#15472B] hover:bg-[#0F3620] text-white px-3 py-2 text-[12px] font-medium cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>

                  {(form.galleryImages || []).length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                      {(form.galleryImages || []).map((imgUrl, idx) => (
                        <div key={idx} className="relative group border border-[#CBD5E1] bg-white aspect-square overflow-hidden">
                          <img
                            src={resolveAssetUrl(imgUrl)}
                            alt={`Gallery thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_IMAGE_PLACEHOLDER;
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remove image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 5: Description & Merchandising */}
              <div className="space-y-4">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#15472B] border-b border-[#E2E8F0] pb-1.5">
                  5. Description &amp; Merchandising
                </h4>

                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Product Editorial Description (Short / Summary)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Short summary displayed below the product title..."
                    value={form.description || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Detailed Description / Full Harvest Story (Powers Product Detail &ldquo;Description&rdquo; Tab)
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Full multi-paragraph description, extraction notes, culinary uses, terroir background... Leave blank to fallback to short description."
                    value={form.detailedDescription || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, detailedDescription: e.target.value }))}
                    className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Merchandising Tag / Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EVOO, Potohar Gold, Raw Sidr Honey, High Curcumin"
                    value={form.tag || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, tag: e.target.value }))}
                    className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                  />
                </div>

                {/* Sections Placement */}
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Storefront Section Visibility
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {SECTION_OPTIONS.map((sec) => {
                      const checked = (form.sections || []).includes(sec);
                      return (
                        <label
                          key={sec}
                          className={`flex items-center gap-2 p-2.5 border cursor-pointer select-none text-[12px] transition-colors ${
                            checked
                              ? 'border-[#15472B] bg-[#15472B]/5 font-semibold text-[#15472B]'
                              : 'border-[#CBD5E1] bg-white text-[#475569]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSection(sec)}
                            className="accent-[#15472B]"
                          />
                          <span className="capitalize">{sec.replace('-', ' ')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Flags / Visibility */}
                <div className="pt-2 flex flex-wrap gap-6 border-t border-[#E2E8F0]">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-[13px] font-medium text-[#0F172A]">
                    <input
                      type="checkbox"
                      checked={form.isActive ?? true}
                      onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="accent-[#15472B] w-4 h-4"
                    />
                    <span>Active (Visible on Storefront)</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-[13px] font-medium text-[#0F172A]">
                    <input
                      type="checkbox"
                      checked={Boolean(form.isSale)}
                      onChange={(e) => setForm((prev) => ({ ...prev, isSale: e.target.checked }))}
                      className="accent-[#15472B] w-4 h-4"
                    />
                    <span>Mark as On Sale</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-[13px] font-medium text-[#0F172A]">
                    <input
                      type="checkbox"
                      checked={Boolean(form.isNew)}
                      onChange={(e) => setForm((prev) => ({ ...prev, isNew: e.target.checked }))}
                      className="accent-[#15472B] w-4 h-4"
                    />
                    <span>Mark as New Harvest</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-[13px] font-medium text-[#0F172A]">
                    <input
                      type="checkbox"
                      checked={Boolean(form.isOrganic)}
                      onChange={(e) => setForm((prev) => ({ ...prev, isOrganic: e.target.checked }))}
                      className="accent-[#15472B] w-4 h-4"
                    />
                    <span>100% Certified Organic</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-3 sticky bottom-0 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-[#CBD5E1] hover:bg-[#F1F5F9] px-4 py-2 text-[12px] font-medium text-[#334155] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#15472B] hover:bg-[#0F3620] disabled:bg-[#94A3B8] text-white px-6 py-2 text-[12px] font-semibold uppercase tracking-[0.07em] cursor-pointer shadow-sm transition-colors"
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
