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
    <div className="space-y-6">
      {/* =========================================================================
          TOP HEADER & SUB-TABS
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">
            Categories &amp; Origins
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Manage your store's taxonomy, category hierarchy, and regional harvest terroirs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={activeSubTab === 'categories' ? loadCategories : loadOrigins}
            className="p-2 border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] rounded transition-colors cursor-pointer"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {activeSubTab === 'categories' ? (
            <button
              type="button"
              onClick={() => openCategoryModal()}
              className="bg-[#15472B] hover:bg-[#0D2F1C] text-white text-[12.5px] font-semibold uppercase tracking-wider px-4 py-2.5 rounded shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openOriginModal()}
              className="bg-[#15472B] hover:bg-[#0D2F1C] text-white text-[12.5px] font-semibold uppercase tracking-wider px-4 py-2.5 rounded shadow-sm transition-all cursor-pointer flex items-center gap-2"
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
      <div className="flex items-center gap-2 border-b border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center gap-2 px-5 py-3 text-[13px] font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'categories'
              ? 'border-[#15472B] text-[#15472B]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categories ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('origins')}
          className={`flex items-center gap-2 px-5 py-3 text-[13px] font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'origins'
              ? 'border-[#15472B] text-[#15472B]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
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
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E2E8F0] p-4 rounded shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Total Categories
              </span>
              <p className="text-[24px] font-bold text-[#0F172A] mt-1 tabular-nums">
                {categories.length}
              </p>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-4 rounded shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Total Subcategories
              </span>
              <p className="text-[24px] font-bold text-[#15472B] mt-1 tabular-nums">
                {totalSubcategoriesCount}
              </p>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-4 rounded shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Department Structure
              </span>
              <p className="text-[15px] font-semibold text-[#0F172A] mt-1 truncate">
                Pantry &amp; Botanicals
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3 bg-white p-3 border border-[#E2E8F0] rounded">
            <Search className="w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              placeholder="Search category name, department, or subcategory..."
              className="w-full text-[13px] bg-transparent focus:outline-none text-[#1E293B] placeholder-[#94A3B8]"
            />
            {catSearch && (
              <button
                type="button"
                onClick={() => setCatSearch('')}
                className="text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Categories Table */}
          {loadingCats ? (
            <div className="p-12 text-center bg-white border border-[#E2E8F0] rounded">
              <Loader2 className="w-6 h-6 animate-spin text-[#15472B] mx-auto mb-2" />
              <p className="text-[13px] text-[#64748B]">Loading categories taxonomy...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#E2E8F0] rounded">
              <p className="text-[14px] text-[#475569] mb-3">No categories found.</p>
              <button
                type="button"
                onClick={() => openCategoryModal()}
                className="bg-[#15472B] text-white text-[12px] font-semibold px-4 py-2 rounded cursor-pointer"
              >
                Create First Category
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Category Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Subcategories</th>
                      <th className="py-3 px-4 text-center">Products</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredCategories.map((cat, idx) => {
                      const catId = cat._id || cat.id || `cat-${idx}`;
                      return (
                        <tr key={catId} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono-data text-[#64748B]">
                            {cat.categoryNumber ?? idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {cat.img ? (
                                <img
                                  src={cat.img}
                                  alt={cat.name}
                                  className="w-8 h-8 rounded object-cover border border-[#E2E8F0]"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded bg-[#15472B]/10 text-[#15472B] flex items-center justify-center font-bold text-xs">
                                  {cat.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-[#0F172A]">{cat.name}</span>
                                {cat.slug && (
                                  <span className="block text-[11px] font-mono-data text-[#94A3B8]">
                                    /{cat.slug}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#475569]">
                            {cat.department || 'Pantry & Botanicals'}
                          </td>
                          <td className="py-3.5 px-4">
                            {cat.subcategories && cat.subcategories.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-w-md">
                                {cat.subcategories.map((sub, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="inline-block text-[11px] bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] px-2 py-0.5 rounded-sm"
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
                          <td className="py-3.5 px-4 text-center font-mono-data text-[#0F172A] font-semibold">
                            {cat.count ?? 0}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openCategoryModal(cat)}
                                className="p-1.5 text-[#475569] hover:text-[#15472B] hover:bg-[#F1F5F9] rounded transition-colors cursor-pointer"
                                title="Edit Category"
                              >
                                <Edit2 className="w-4 h-4" />
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
                                className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FDF2F2] rounded transition-colors cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 className="w-4 h-4" />
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
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E2E8F0] p-4 rounded shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Registered Origins
              </span>
              <p className="text-[24px] font-bold text-[#0F172A] mt-1 tabular-nums">
                {origins.length}
              </p>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-4 rounded shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Primary Belts
              </span>
              <p className="text-[15px] font-semibold text-[#15472B] mt-1">
                Potohar, Swat &amp; Karakoram
              </p>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-4 rounded shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Integration Status
              </span>
              <p className="text-[13px] font-medium text-[#16A34A] mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                Active in Product Dropdown &amp; Shop Filters
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3 bg-white p-3 border border-[#E2E8F0] rounded">
            <Search className="w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={originSearch}
              onChange={(e) => setOriginSearch(e.target.value)}
              placeholder="Search origin name, province or region..."
              className="w-full text-[13px] bg-transparent focus:outline-none text-[#1E293B] placeholder-[#94A3B8]"
            />
            {originSearch && (
              <button
                type="button"
                onClick={() => setOriginSearch('')}
                className="text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Origins Table */}
          {loadingOrigins ? (
            <div className="p-12 text-center bg-white border border-[#E2E8F0] rounded">
              <Loader2 className="w-6 h-6 animate-spin text-[#15472B] mx-auto mb-2" />
              <p className="text-[13px] text-[#64748B]">Loading harvest origins...</p>
            </div>
          ) : filteredOrigins.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#E2E8F0] rounded">
              <p className="text-[14px] text-[#475569] mb-3">No origins found.</p>
              <button
                type="button"
                onClick={() => openOriginModal()}
                className="bg-[#15472B] text-white text-[12px] font-semibold px-4 py-2 rounded cursor-pointer"
              >
                Add First Origin
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Origin / Terroir</th>
                      <th className="py-3 px-4">Province / Region</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-center">Linked Products</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredOrigins.map((orig, idx) => {
                      const originId = orig._id || orig.id || `orig-${idx}`;
                      return (
                        <tr key={originId} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[#15472B] shrink-0" />
                              <span>{orig.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#475569]">
                            {orig.region || 'Pakistan'}
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B] max-w-xs truncate">
                            {orig.description || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono-data font-semibold text-[#0F172A]">
                            {orig.productCount ?? orig.count ?? 0}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openOriginModal(orig)}
                                className="p-1.5 text-[#475569] hover:text-[#15472B] hover:bg-[#F1F5F9] rounded transition-colors cursor-pointer"
                                title="Edit Origin"
                              >
                                <Edit2 className="w-4 h-4" />
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
                                className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FDF2F2] rounded transition-colors cursor-pointer"
                                title="Delete Origin"
                              >
                                <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-[#CBD5E1]">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="text-[16px] font-bold text-[#0F172A]">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] rounded cursor-pointer"
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

              <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 border border-[#CBD5E1] text-[#475569] text-[12.5px] font-semibold rounded hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSubmitting}
                  className="px-5 py-2 bg-[#15472B] hover:bg-[#0D2F1C] disabled:bg-[#888888] text-white text-[12.5px] font-semibold rounded cursor-pointer flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-[#CBD5E1]">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="text-[16px] font-bold text-[#0F172A]">
                {editingOrigin ? 'Edit Origin' : 'Add New Origin'}
              </h3>
              <button
                type="button"
                onClick={() => setIsOriginModalOpen(false)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrigin} className="p-5 space-y-4">
              {originError && (
                <div className="p-3 bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-[13px] rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
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
                  className="w-full border border-[#CBD5E1] px-3.5 py-2 text-[13px] rounded focus:outline-none focus:border-[#15472B]"
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
                  className="w-full border border-[#CBD5E1] px-3.5 py-2 text-[13px] rounded focus:outline-none focus:border-[#15472B]"
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
                  className="w-full border border-[#CBD5E1] px-3.5 py-2 text-[13px] rounded focus:outline-none focus:border-[#15472B]"
                />
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOriginModalOpen(false)}
                  className="px-4 py-2 border border-[#CBD5E1] text-[#475569] text-[12.5px] font-semibold rounded hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={originSubmitting}
                  className="px-5 py-2 bg-[#15472B] hover:bg-[#0D2F1C] disabled:bg-[#888888] text-white text-[12.5px] font-semibold rounded cursor-pointer flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5 border border-[#CBD5E1] text-center">
            <div className="w-10 h-10 rounded-full bg-[#FDF2F2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[15px] text-[#0F172A]">
              Delete {deleteTarget.type === 'category' ? 'Category' : 'Origin'}?
            </h3>
            <p className="text-[12.5px] text-[#64748B] mt-1 mb-5">
              Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-[#CBD5E1] text-[#475569] text-[12px] font-semibold rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[12px] font-semibold rounded cursor-pointer flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
