import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  FolderTree,
  Tag,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  fetchAdminOrigins,
  createAdminOrigin,
  updateAdminOrigin,
  deleteAdminOrigin,
} from '../services/adminApi';

interface SubcategoryItem {
  name: string;
  slug?: string;
  count?: number;
}

interface CategoryItem {
  _id?: string;
  id?: string;
  categoryNumber?: number;
  name: string;
  slug?: string;
  department?: string;
  description?: string;
  count?: number;
  img?: string;
  icon?: string;
  subcategories?: SubcategoryItem[];
}

interface OriginItem {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  region?: string;
  description?: string;
  count?: number;
  productCount?: number;
  isActive?: boolean;
}

export const CategoriesView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'origins'>('categories');

  // Categories state
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [catSearch, setCatSearch] = useState('');
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // Form state for category
  const [catName, setCatName] = useState('');
  const [catNumber, setCatNumber] = useState<number | ''>('');
  const [catDepartment, setCatDepartment] = useState('Pantry & Botanicals');
  const [catDesc, setCatDesc] = useState('');
  const [catImg, setCatImg] = useState('');
  const [catSubcategories, setCatSubcategories] = useState<string[]>([]);
  const [newSubInput, setNewSubInput] = useState('');

  // Origins state
  const [origins, setOrigins] = useState<OriginItem[]>([]);
  const [loadingOrigins, setLoadingOrigins] = useState(true);
  const [originSearch, setOriginSearch] = useState('');
  const [editingOrigin, setEditingOrigin] = useState<OriginItem | null>(null);
  const [isOriginModalOpen, setIsOriginModalOpen] = useState(false);
  const [originSubmitting, setOriginSubmitting] = useState(false);
  const [originError, setOriginError] = useState<string | null>(null);

  // Form state for origin
  const [originName, setOriginName] = useState('');
  const [originRegion, setOriginRegion] = useState('');
  const [originDesc, setOriginDesc] = useState('');

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'category' | 'origin';
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load categories
  const loadCategories = async () => {
    setLoadingCats(true);
    try {
      const data = await fetchAdminCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCats(false);
    }
  };

  // Load origins
  const loadOrigins = async () => {
    setLoadingOrigins(true);
    try {
      const data = await fetchAdminOrigins();
      setOrigins(data);
    } catch (err) {
      console.error('Failed to load origins:', err);
    } finally {
      setLoadingOrigins(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadOrigins();
  }, []);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = catSearch.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.department?.toLowerCase().includes(q) ||
        c.subcategories?.some((s) => s.name.toLowerCase().includes(q))
    );
  }, [categories, catSearch]);

  // Filtered origins
  const filteredOrigins = useMemo(() => {
    const q = originSearch.toLowerCase().trim();
    if (!q) return origins;
    return origins.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.region?.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q)
    );
  }, [origins, originSearch]);

  // Open modal for Category Add/Edit
  const openCategoryModal = (cat?: CategoryItem) => {
    setCatError(null);
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatNumber(cat.categoryNumber ?? '');
      setCatDepartment(cat.department || 'Pantry & Botanicals');
      setCatDesc(cat.description || '');
      setCatImg(cat.img || '');
      setCatSubcategories(cat.subcategories?.map((s) => s.name) || []);
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatNumber(categories.length + 1);
      setCatDepartment('Pantry & Botanicals');
      setCatDesc('');
      setCatImg('');
      setCatSubcategories([]);
    }
    setNewSubInput('');
    setIsCatModalOpen(true);
  };

  // Add subcategory tag in modal
  const handleAddSubcategory = () => {
    const trimmed = newSubInput.trim();
    if (trimmed && !catSubcategories.includes(trimmed)) {
      setCatSubcategories([...catSubcategories, trimmed]);
      setNewSubInput('');
    }
  };

  // Remove subcategory tag
  const handleRemoveSubcategory = (name: string) => {
    setCatSubcategories(catSubcategories.filter((s) => s !== name));
  };

  // Submit Category (Add / Edit)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setCatError('Category name is required.');
      return;
    }

    setCatSubmitting(true);
    setCatError(null);

    const payload = {
      name: catName.trim(),
      categoryNumber: catNumber ? Number(catNumber) : undefined,
      department: catDepartment.trim() || 'Pantry & Botanicals',
      description: catDesc.trim(),
      img: catImg.trim(),
      subcategories: catSubcategories.map((s) => ({
        name: s,
        slug: s.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      })),
    };

    try {
      const catId = editingCategory?._id || editingCategory?.id;
      if (editingCategory && catId) {
        await updateAdminCategory(catId, payload);
      } else {
        await createAdminCategory(payload);
      }
      await loadCategories();
      setIsCatModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save category';
      setCatError(msg);
    } finally {
      setCatSubmitting(false);
    }
  };

  // Open modal for Origin Add/Edit
  const openOriginModal = (origin?: OriginItem) => {
    setOriginError(null);
    if (origin) {
      setEditingOrigin(origin);
      setOriginName(origin.name);
      setOriginRegion(origin.region || '');
      setOriginDesc(origin.description || '');
    } else {
      setEditingOrigin(null);
      setOriginName('');
      setOriginRegion('');
      setOriginDesc('');
    }
    setIsOriginModalOpen(true);
  };

  // Submit Origin (Add / Edit)
  const handleSaveOrigin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originName.trim()) {
      setOriginError('Origin name is required.');
      return;
    }

    setOriginSubmitting(true);
    setOriginError(null);

    const payload = {
      name: originName.trim(),
      region: originRegion.trim() || 'Pakistan',
      description: originDesc.trim(),
    };

    try {
      const originId = editingOrigin?._id || editingOrigin?.id;
      if (editingOrigin && originId) {
        await updateAdminOrigin(originId, payload);
      } else {
        await createAdminOrigin(payload);
      }
      await loadOrigins();
      setIsOriginModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save origin';
      setOriginError(msg);
    } finally {
      setOriginSubmitting(false);
    }
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'category') {
        await deleteAdminCategory(deleteTarget.id);
        await loadCategories();
      } else {
        await deleteAdminOrigin(deleteTarget.id);
        await loadOrigins();
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Stats calculation
  const totalSubcategoriesCount = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.subcategories?.length || 0), 0);
  }, [categories]);

  return (
    <div className="space-y-5">
      {/* =========================================================================
          TOP HEADER
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[25px] font-bold text-[#0F172A] tracking-tight">
            Categories &amp; Origins
          </h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Manage your store's taxonomy, category hierarchy, and regional harvest terroirs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={activeSubTab === 'categories' ? loadCategories : loadOrigins}
            disabled={loadingCats || loadingOrigins}
            className="p-2 border border-[#E5E9E4] bg-white hover:border-[#0F172A] rounded-xl text-[#334155] cursor-pointer shadow-2xs transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${(loadingCats || loadingOrigins) ? 'animate-spin text-[#15472B]' : ''}`} />
          </button>

          {activeSubTab === 'categories' ? (
            <button
              type="button"
              onClick={() => openCategoryModal()}
              className="bg-[#0E291C] hover:bg-[#15472B] text-white text-[12.5px] font-semibold px-4 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openOriginModal()}
              className="bg-[#0E291C] hover:bg-[#15472B] text-white text-[12.5px] font-semibold px-4 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Origin</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          SUB-TAB NAVIGATION PILLS
          ========================================================================= */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'categories'
              ? 'bg-[#0E291C] text-white shadow-2xs'
              : 'bg-white border border-[#E5E9E4] text-[#64748B] hover:bg-[#F8FAF7]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categories ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('origins')}
          className={`flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'origins'
              ? 'bg-[#0E291C] text-white shadow-2xs'
              : 'bg-white border border-[#E5E9E4] text-[#64748B] hover:bg-[#F8FAF7]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Origins &amp; Terroirs ({origins.length})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: CATEGORIES MANAGEMENT
          ========================================================================= */}
      {activeSubTab === 'categories' && (
        <div className="space-y-5">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Total Categories</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">(Store Taxonomy)</p>
                </div>
              </div>
              <div className="mt-3 relative z-10">
                <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
                  {categories.length}
                </p>
                <p className="mt-2 text-[12px] text-[#475569] font-mono-data">
                  Primary client navigation groups
                </p>
              </div>
              <div className="absolute right-0 bottom-0 pointer-events-none z-0">
                <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
                  <path d="M0,58 C30,52 50,30 80,45 C110,60 125,25 140,32 L140,65 L0,65 Z" fill="#86EFAC" fillOpacity="0.25" />
                  <path d="M30,62 C60,48 85,22 115,38 C128,45 136,25 140,20 L140,65 L30,65 Z" fill="#BBF7D0" fillOpacity="0.35" />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Subcategories</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">(Nested Taxonomy)</p>
                </div>
              </div>
              <div className="mt-3 relative z-10">
                <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
                  {totalSubcategoriesCount}
                </p>
                <p className="mt-2 text-[12px] text-[#475569] font-mono-data">
                  Fine-grained filtering tags
                </p>
              </div>
              <div className="absolute right-0 bottom-0 pointer-events-none z-0">
                <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
                  <path d="M0,60 C25,50 55,28 85,42 C115,56 128,24 140,30 L140,65 L0,65 Z" fill="#86EFAC" fillOpacity="0.22" />
                  <path d="M25,64 C55,46 80,20 110,36 C124,44 135,26 140,22 L140,65 L25,65 Z" fill="#BBF7D0" fillOpacity="0.32" />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Department</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">(Storefront Root)</p>
                </div>
              </div>
              <div className="mt-3 relative z-10">
                <p className="text-[20px] font-bold text-[#0F172A] truncate leading-tight">
                  Pantry &amp; Botanicals
                </p>
                <p className="mt-2 text-[12px] text-[#475569] font-mono-data">
                  Pak Veda &amp; Zaitoon Pakistan
                </p>
              </div>
              <div className="absolute right-0 bottom-0 pointer-events-none z-0">
                <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
                  <path d="M0,62 C35,50 65,30 95,45 C120,55 132,25 140,30 L140,65 L0,65 Z" fill="#FED7AA" fillOpacity="0.35" />
                  <path d="M20,65 C55,48 80,22 110,38 C125,46 135,28 140,22 L140,65 L20,65 Z" fill="#FFEDD5" fillOpacity="0.45" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder="Search category name, department, or subcategory..."
                className="w-full border border-[#CBD5E1] bg-white rounded-xl px-3.5 py-2 pr-9 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B] transition-all shadow-2xs"
              />
              <Search className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {catSearch && (
              <button
                type="button"
                onClick={() => setCatSearch('')}
                className="text-[12px] font-semibold text-[#15472B] hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Categories Table */}
          {loadingCats ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E9E4]">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#15472B] mb-2" />
              <p className="text-[13px] text-[#64748B]">Loading categories taxonomy...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-14 text-center bg-white rounded-2xl border border-[#E5E9E4]">
              <p className="text-[14px] text-[#475569] mb-3">No categories match your search.</p>
              <button
                type="button"
                onClick={() => openCategoryModal()}
                className="bg-[#0E291C] hover:bg-[#15472B] text-white text-[12px] font-semibold px-4 py-2 rounded-xl cursor-pointer"
              >
                Create Category
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E9E4] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAF7] border-b border-[#E5E9E4] text-[#64748B] text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Category Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Subcategories</th>
                      <th className="py-3 px-4 text-center">Products</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filteredCategories.map((cat, idx) => {
                      const catId = cat._id || cat.id || `cat-${idx}`;
                      return (
                        <tr key={catId} className="hover:bg-[#F9FAF8] transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono-data text-[#64748B]">
                            {cat.categoryNumber ?? idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {cat.img ? (
                                <img
                                  src={cat.img}
                                  alt={cat.name}
                                  className="w-9 h-9 rounded-xl object-cover border border-[#E5E9E4]"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-[#0F3520] text-[#4ADE80] flex items-center justify-center font-bold text-xs shadow-inner">
                                  {cat.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-[#0F172A] text-[13.5px]">{cat.name}</span>
                                {cat.slug && (
                                  <span className="block text-[11px] font-mono-data text-[#94A3B8]">
                                    /{cat.slug}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#475569] font-medium">
                            {cat.department || 'Pantry & Botanicals'}
                          </td>
                          <td className="py-3.5 px-4">
                            {cat.subcategories && cat.subcategories.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-w-md">
                                {cat.subcategories.map((sub, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="inline-block text-[11px] bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] px-2.5 py-0.5 rounded-full font-medium"
                                  >
                                    {sub.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11.5px] text-[#94A3B8] italic">
                                No subcategories
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono-data text-[#0F172A] font-bold">
                            {cat.count ?? 0}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openCategoryModal(cat)}
                                className="p-1.5 border border-[#E5E9E4] hover:border-[#0F172A] hover:bg-[#F8FAF7] rounded-lg text-[#334155] cursor-pointer shadow-2xs transition-colors"
                                title="Edit Category"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'category',
                                    id: catId,
                                    name: cat.name,
                                  })
                                }
                                className="p-1.5 border border-[#FECACA] hover:bg-[#FEF2F2] rounded-lg text-[#DC2626] cursor-pointer shadow-2xs transition-colors"
                                title="Delete Category"
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
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: ORIGINS & TERROIRS MANAGEMENT
          ========================================================================= */}
      {activeSubTab === 'origins' && (
        <div className="space-y-5">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Registered Origins</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">(Pakistani Terroirs)</p>
                </div>
              </div>
              <div className="mt-3 relative z-10">
                <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
                  {origins.length}
                </p>
                <p className="mt-2 text-[12px] text-[#475569] font-mono-data">
                  Active geographic origins
                </p>
              </div>
              <div className="absolute right-0 bottom-0 pointer-events-none z-0">
                <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
                  <path d="M0,58 C30,52 50,30 80,45 C110,60 125,25 140,32 L140,65 L0,65 Z" fill="#86EFAC" fillOpacity="0.25" />
                  <path d="M30,62 C60,48 85,22 115,38 C128,45 136,25 140,20 L140,65 L30,65 Z" fill="#BBF7D0" fillOpacity="0.35" />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Primary Belts</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">(Orchard Clusters)</p>
                </div>
              </div>
              <div className="mt-3 relative z-10">
                <p className="text-[18px] font-bold text-[#0F172A] truncate">
                  Potohar, Swat &amp; Karakoram
                </p>
                <p className="mt-2 text-[12px] text-[#475569] font-mono-data">
                  Northern and Sub-Himalayan
                </p>
              </div>
              <div className="absolute right-0 bottom-0 pointer-events-none z-0">
                <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
                  <path d="M0,60 C25,50 55,28 85,42 C115,56 128,24 140,30 L140,65 L0,65 Z" fill="#86EFAC" fillOpacity="0.22" />
                  <path d="M25,64 C55,46 80,20 110,36 C124,44 135,26 140,22 L140,65 L25,65 Z" fill="#BBF7D0" fillOpacity="0.32" />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Integration</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">(Storefront Filter)</p>
                </div>
              </div>
              <div className="mt-3 relative z-10">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                  Active in Shop
                </span>
                <p className="mt-2 text-[12px] text-[#475569] font-mono-data">
                  Synchronized with product catalogue
                </p>
              </div>
              <div className="absolute right-0 bottom-0 pointer-events-none z-0">
                <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
                  <path d="M0,62 C35,50 65,30 95,45 C120,55 132,25 140,30 L140,65 L0,65 Z" fill="#86EFAC" fillOpacity="0.25" />
                  <path d="M20,65 C55,48 80,22 110,38 C125,46 135,28 140,22 L140,65 L20,65 Z" fill="#BBF7D0" fillOpacity="0.35" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={originSearch}
                onChange={(e) => setOriginSearch(e.target.value)}
                placeholder="Search origin name, province or region..."
                className="w-full border border-[#CBD5E1] bg-white rounded-xl px-3.5 py-2 pr-9 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B] transition-all shadow-2xs"
              />
              <Search className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {originSearch && (
              <button
                type="button"
                onClick={() => setOriginSearch('')}
                className="text-[12px] font-semibold text-[#15472B] hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Origins Table */}
          {loadingOrigins ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E9E4]">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#15472B] mb-2" />
              <p className="text-[13px] text-[#64748B]">Loading harvest origins...</p>
            </div>
          ) : filteredOrigins.length === 0 ? (
            <div className="p-14 text-center bg-white rounded-2xl border border-[#E5E9E4]">
              <p className="text-[14px] text-[#475569] mb-3">No origins match your search.</p>
              <button
                type="button"
                onClick={() => openOriginModal()}
                className="bg-[#0E291C] hover:bg-[#15472B] text-white text-[12px] font-semibold px-4 py-2 rounded-xl cursor-pointer"
              >
                Add Origin
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E9E4] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAF7] border-b border-[#E5E9E4] text-[#64748B] text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Origin / Terroir</th>
                      <th className="py-3 px-4">Province / Region</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-center">Linked Products</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filteredOrigins.map((orig, idx) => {
                      const originId = orig._id || orig.id || `orig-${idx}`;
                      return (
                        <tr key={originId} className="hover:bg-[#F9FAF8] transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[#15472B] shrink-0" />
                              <span>{orig.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#475569] font-medium">
                            {orig.region || 'Pakistan'}
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B] max-w-xs truncate">
                            {orig.description || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono-data font-bold text-[#0F172A]">
                            {orig.productCount ?? orig.count ?? 0}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openOriginModal(orig)}
                                className="p-1.5 border border-[#E5E9E4] hover:border-[#0F172A] hover:bg-[#F8FAF7] rounded-lg text-[#334155] cursor-pointer shadow-2xs transition-colors"
                                title="Edit Origin"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'origin',
                                    id: originId,
                                    name: orig.name,
                                  })
                                }
                                className="p-1.5 border border-[#FECACA] hover:bg-[#FEF2F2] rounded-lg text-[#DC2626] cursor-pointer shadow-2xs transition-colors"
                                title="Delete Origin"
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
            </div>
          )}
        </div>
      )}
      {/* =========================================================================
          MODAL: ADD / EDIT CATEGORY
          ========================================================================= */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col border border-[#E5E9E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 bg-[#0E291C] text-white flex items-center justify-between border-b border-[#1C4D32]">
              <div>
                <h3 className="text-[17px] font-bold text-white font-mono-data">
                  {editingCategory ? 'Edit Category Taxonomy' : 'Add New Category'}
                </h3>
                <p className="text-[12px] text-white/70 mt-0.5">
                  Configure title, subcategories, and storefront department
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              {catError && (
                <div className="p-3 bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-[13px] rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{catError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] uppercase font-bold text-[#475569] mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Cold-Pressed Olive Oils"
                    className="w-full border border-[#CBD5E1] px-3.5 py-2 text-[13px] rounded focus:outline-none focus:border-[#15472B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#475569] mb-1">
                    Serial / Number
                  </label>
                  <input
                    type="number"
                    value={catNumber}
                    onChange={(e) =>
                      setCatNumber(e.target.value ? Number(e.target.value) : '')
                    }
                    placeholder="e.g. 1"
                    className="w-full border border-[#CBD5E1] px-3.5 py-2 text-[13px] rounded focus:outline-none focus:border-[#15472B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#475569] mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={catDepartment}
                  onChange={(e) => setCatDepartment(e.target.value)}
                  placeholder="Pantry & Botanicals"
                  className="w-full border border-[#CBD5E1] px-3.5 py-2 text-[13px] rounded focus:outline-none focus:border-[#15472B]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#475569] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Single-origin cold-extracted oils from Potohar..."
                  className="w-full border border-[#CBD5E1] px-3.5 py-2 text-[13px] rounded focus:outline-none focus:border-[#15472B]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#475569] mb-1">
                  Image URL / Asset Path
                </label>
                <input
                  type="text"
                  value={catImg}
                  onChange={(e) => setCatImg(e.target.value)}
                  placeholder="/assets/images/product_olive_oil_1794763960228.jpg"
                  className="w-full border border-[#CBD5E1] px-3.5 py-2 text-[13px] rounded focus:outline-none focus:border-[#15472B]"
                />
              </div>

              {/* Interactive Subcategories Manager */}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <label className="block text-[11px] uppercase font-bold text-[#475569] mb-1.5">
                  Subcategories Taxonomy
                </label>
                <div className="flex gap-2 mb-2.5">
                  <input
                    type="text"
                    value={newSubInput}
                    onChange={(e) => setNewSubInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubcategory();
                      }
                    }}
                    placeholder="Type subcategory (e.g. Extra Virgin EVOO) and click Add"
                    className="flex-1 border border-[#CBD5E1] px-3 py-1.5 text-[12.5px] rounded focus:outline-none focus:border-[#15472B]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    className="bg-[#1E293B] hover:bg-[#0F172A] text-white px-3.5 py-1.5 text-[12px] font-semibold rounded transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                  {catSubcategories.length === 0 ? (
                    <span className="text-[12px] text-[#94A3B8] italic">
                      No subcategories added yet.
                    </span>
                  ) : (
                    catSubcategories.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1.5 bg-white border border-[#CBD5E1] text-[#1E293B] text-[12px] px-2.5 py-1 rounded"
                      >
                        <span>{sub}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcategory(sub)}
                          className="text-[#94A3B8] hover:text-[#DC2626] cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E9E4] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E9E4] text-[#475569] text-[12.5px] font-semibold rounded-xl hover:bg-[#F8FAF7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSubmitting}
                  className="px-5 py-2 bg-[#0E291C] hover:bg-[#15472B] disabled:bg-[#888888] text-white text-[12.5px] font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  {catSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT ORIGIN
          ========================================================================= */}
      {isOriginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#E5E9E4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 bg-[#0E291C] text-white flex items-center justify-between border-b border-[#1C4D32]">
              <div>
                <h3 className="text-[17px] font-bold text-white font-mono-data">
                  {editingOrigin ? 'Edit Terroir Origin' : 'Add New Harvest Origin'}
                </h3>
                <p className="text-[12px] text-white/70 mt-0.5">
                  Configure geographic belt, regional soil profile, and province
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOriginModalOpen(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrigin} className="p-6 space-y-4">
              {originError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[13px] rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                  <span>{originError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#475569] mb-1">
                  Origin Name *
                </label>
                <input
                  type="text"
                  required
                  value={originName}
                  onChange={(e) => setOriginName(e.target.value)}
                  placeholder="e.g. Potohar / Swat / Skardu"
                  className="w-full border border-[#CBD5E1] px-3.5 py-2 text-[13px] rounded-xl focus:outline-none focus:border-[#15472B]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#475569] mb-1">
                  Region / Province
                </label>
                <input
                  type="text"
                  value={originRegion}
                  onChange={(e) => setOriginRegion(e.target.value)}
                  placeholder="e.g. Punjab Olive Belt, KP, Gilgit-Baltistan"
                  className="w-full border border-[#CBD5E1] px-3.5 py-2 text-[13px] rounded-xl focus:outline-none focus:border-[#15472B]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#475569] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={originDesc}
                  onChange={(e) => setOriginDesc(e.target.value)}
                  placeholder="Details about the soil, climate, or harvest terroir..."
                  className="w-full border border-[#CBD5E1] px-3.5 py-2 text-[13px] rounded-xl focus:outline-none focus:border-[#15472B]"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E9E4] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOriginModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E9E4] text-[#475569] text-[12.5px] font-semibold rounded-xl hover:bg-[#F8FAF7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={originSubmitting}
                  className="px-5 py-2 bg-[#0E291C] hover:bg-[#15472B] disabled:bg-[#888888] text-white text-[12.5px] font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  {originSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingOrigin ? 'Update Origin' : 'Save Origin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONFIRM DELETE MODAL
          ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-[#E5E9E4] text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto mb-3.5">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[16px] text-[#0F172A]">
              Delete {deleteTarget.type === 'category' ? 'Category' : 'Origin'}?
            </h3>
            <p className="text-[13px] text-[#64748B] mt-1.5 mb-6">
              Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-[#E5E9E4] text-[#475569] text-[12px] font-semibold rounded-xl hover:bg-[#F8FAF7] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[12px] font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
