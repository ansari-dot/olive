import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Save,
  Search,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Sliders,
} from 'lucide-react';
import type {
  AdminProduct,
  HomepageSectionKey,
  AdminSectionsResponse,
} from '../types/admin';
import {
  fetchAdminSections,
  updateAdminSectionLayout,
  resolveMediaUrl,
  DEFAULT_IMAGE_PLACEHOLDER,
} from '../services/adminApi';
import { formatPKR } from '../utils/formatters';

interface SectionConfig {
  key: HomepageSectionKey;
  title: string;
  subtitle: string;
  recommendedCount: string;
}

const SECTIONS: SectionConfig[] = [
  {
    key: 'featured-grid',
    title: 'Featured Harvest Grid',
    subtitle: 'Prominently showcased 4-column studio grid on the client homepage',
    recommendedCount: '4–8 items',
  },
  {
    key: 'best-sellers',
    title: 'Best Sellers Trio',
    subtitle: 'Highlighted top harvest sellers on the warm cream homepage row',
    recommendedCount: '3–6 items',
  },
  {
    key: 'unique',
    title: 'Unique & Rare Creations',
    subtitle: 'Limited orchard harvests, wild honey, and botanical infusions',
    recommendedCount: '4–8 items',
  },
  {
    key: 'shop',
    title: 'Main Shop Showcase',
    subtitle: 'Primary product catalogue displayed in the full Shop view',
    recommendedCount: 'All or curated',
  },
];

export const HomepageSectionsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<HomepageSectionKey>('featured-grid');
  const [sectionsData, setSectionsData] = useState<Record<HomepageSectionKey, AdminProduct[]>>({
    'featured-grid': [],
    'best-sellers': [],
    unique: [],
    shop: [],
  });
  const [allProducts, setAllProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search filter for available products to add
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res: AdminSectionsResponse = await fetchAdminSections();
      setSectionsData({
        'featured-grid': res.sections['featured-grid'] || [],
        'best-sellers': res.sections['best-sellers'] || [],
        unique: res.sections.unique || [],
        shop: res.sections.shop || [],
      });
      setAllProducts(res.products || []);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load section layouts',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentAssigned = sectionsData[activeSection] || [];
  const assignedIds = useMemo(() => new Set(currentAssigned.map((p) => p._id)), [currentAssigned]);

  // Unassigned products available for selection
  const availableToAdd = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allProducts.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q);
      return matchesSearch && !assignedIds.has(p._id);
    });
  }, [allProducts, assignedIds, searchQuery]);

  // Move product up in display sequence
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...currentAssigned];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setSectionsData((prev) => ({ ...prev, [activeSection]: updated }));
  };

  // Move product down in display sequence
  const handleMoveDown = (index: number) => {
    if (index >= currentAssigned.length - 1) return;
    const updated = [...currentAssigned];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setSectionsData((prev) => ({ ...prev, [activeSection]: updated }));
  };

  // Remove product from section
  const handleRemove = (productId: string) => {
    const updated = currentAssigned.filter((p) => p._id !== productId);
    setSectionsData((prev) => ({ ...prev, [activeSection]: updated }));
  };

  // Add product to section
  const handleAddProduct = (product: AdminProduct) => {
    const updated = [...currentAssigned, product];
    setSectionsData((prev) => ({ ...prev, [activeSection]: updated }));
  };

  // Save changes to backend MongoDB
  const handleSaveLayout = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const items = currentAssigned.map((p, index) => ({
        productId: p._id,
        order: index + 1,
      }));

      await updateAdminSectionLayout(activeSection, items);

      setFeedback({
        type: 'success',
        message: `Successfully saved ${currentAssigned.length} products to "${
          SECTIONS.find((s) => s.key === activeSection)?.title
        }". Changes are live on the Storefront!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save layout changes',
      });
    } finally {
      setSaving(false);
    }
  };

  const activeSectionConfig = SECTIONS.find((s) => s.key === activeSection)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAEAEA] pb-5">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#181818] tracking-tight flex items-center gap-2.5">
            <LayoutGrid className="w-6 h-6 text-[#224D26]" />
            Homepage Section Merchandising
          </h1>
          <p className="text-sm text-[#666666] mt-1">
            Choose which products appear in each client homepage row and control their exact display order.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading || saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D4D4D4] bg-white hover:bg-[#F9F9F9] text-[#444444] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleSaveLayout}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#224D26] hover:bg-[#1B3E1F] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Section Layout
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3.5 text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-[#22C55E]" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#EF4444]" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline hover:no-underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SECTIONS.map((sec) => {
          const isSelected = activeSection === sec.key;
          const count = (sectionsData[sec.key] || []).length;
          return (
            <button
              key={sec.key}
              type="button"
              onClick={() => {
                setActiveSection(sec.key);
                setFeedback(null);
              }}
              className={`text-left p-4 border transition-all relative ${
                isSelected
                  ? 'border-[#224D26] bg-[#FAF8F5] shadow-sm ring-1 ring-[#224D26]'
                  : 'border-[#EAEAEA] bg-white hover:border-[#D4D4D4]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
                  {sec.title}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                    isSelected
                      ? 'bg-[#224D26] text-white'
                      : 'bg-[#F0EFEA] text-[#444444]'
                  }`}
                >
                  {count}
                </span>
              </div>
              <p className="text-[12px] text-[#777777] line-clamp-2 leading-relaxed">
                {sec.subtitle}
              </p>
              <div className="mt-2.5 text-[10.5px] text-[#999999] flex items-center gap-1">
                <span>Target:</span>
                <span className="font-medium text-[#555555]">{sec.recommendedCount}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Section Editor Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ordered Merchandising List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-[#FAF8F5] border border-[#EAEAEA] p-3.5">
            <div>
              <h2 className="text-sm font-semibold text-[#181818] uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#224D26]" />
                {activeSectionConfig.title} — Active Display Sequence
              </h2>
              <p className="text-xs text-[#777777] mt-0.5">
                Products render on the client homepage in the exact numbered order below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddDrawer(!showAddDrawer)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#224D26] text-white text-xs font-medium hover:bg-[#1B3E1F] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {showAddDrawer ? 'Hide Catalog Picker' : 'Add Products'}
            </button>
          </div>

          {currentAssigned.length === 0 ? (
            <div className="p-12 text-center bg-white border border-dashed border-[#D4D4D4] space-y-3">
              <LayoutGrid className="w-8 h-8 text-[#999999] mx-auto" />
              <p className="text-sm font-medium text-[#444444]">
                No products are currently assigned to this section.
              </p>
              <p className="text-xs text-[#777777] max-w-md mx-auto">
                Use the product picker on the right to select which harvest items appear in this homepage area.
              </p>
              <button
                type="button"
                onClick={() => setShowAddDrawer(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#224D26] text-[#224D26] text-xs font-semibold uppercase tracking-wider hover:bg-[#FAF8F5] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Browse Catalog to Assign
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#EAEAEA] divide-y divide-[#EAEAEA]">
              {currentAssigned.map((product, idx) => (
                <div
                  key={product._id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF9F6] transition-colors"
                >
                  {/* Sequence Position */}
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 flex items-center justify-center bg-[#F4F1EA] text-[#224D26] font-bold text-xs rounded-full tabular-nums shrink-0">
                      {idx + 1}
                    </span>
                    <img
                      src={resolveMediaUrl(product.image)}
                      alt={product.name}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== DEFAULT_IMAGE_PLACEHOLDER) {
                          target.onerror = null;
                          target.src = DEFAULT_IMAGE_PLACEHOLDER;
                        }
                      }}
                      className="w-12 h-12 object-cover border border-[#EAEAEA] bg-[#FAF8F5] shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#181818] line-clamp-1">
                          {product.name}
                        </span>
                        {!product.isActive && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-[#FEE2E2] text-[#991B1B] font-semibold uppercase">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#777777] mt-0.5">
                        <span className="font-mono text-[11px] text-[#555555]">{product.sku}</span>
                        <span>•</span>
                        <span>{product.brand}</span>
                        <span>•</span>
                        <span className="font-semibold text-[#181818] tabular-nums">
                          {formatPKR(product.price)}
                        </span>
                        <span>•</span>
                        <span className="tabular-nums">Stock: {product.stock}</span>
                      </div>
                    </div>
                  </div>

                  {/* Move Up / Down & Remove Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      title="Move Up"
                      className="p-1.5 border border-[#D4D4D4] hover:bg-white text-[#444444] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === currentAssigned.length - 1}
                      title="Move Down"
                      className="p-1.5 border border-[#D4D4D4] hover:bg-white text-[#444444] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(product._id)}
                      title="Remove from Section"
                      className="p-1.5 border border-[#FECACA] hover:bg-[#FEF2F2] text-[#DC2626] cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Searchable Catalog Picker */}
        <div className="space-y-4">
          <div className="bg-white border border-[#EAEAEA] p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#181818] flex items-center justify-between">
              <span>Add From Catalog</span>
              <span className="text-[11px] text-[#888888] font-normal">
                {availableToAdd.length} available
              </span>
            </h3>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU..."
                className="w-full text-xs pl-8 pr-3 py-2 border border-[#D4D4D4] focus:outline-none focus:border-[#224D26]"
              />
            </div>

            {/* List of unassigned products */}
            <div className="max-h-[500px] overflow-y-auto divide-y divide-[#EAEAEA] border border-[#EAEAEA]">
              {availableToAdd.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#888888]">
                  {searchQuery ? 'No matching products found.' : 'All catalog products are already assigned.'}
                </div>
              ) : (
                availableToAdd.map((product) => (
                  <div
                    key={product._id}
                    className="p-2.5 flex items-center justify-between gap-2.5 hover:bg-[#FAF9F6] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={resolveMediaUrl(product.image)}
                        alt={product.name}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== DEFAULT_IMAGE_PLACEHOLDER) {
                            target.onerror = null;
                            target.src = DEFAULT_IMAGE_PLACEHOLDER;
                          }
                        }}
                        className="w-9 h-9 object-cover border border-[#EAEAEA] bg-[#FAF8F5] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#181818] truncate">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-[#777777]">
                          <span className="font-mono">{product.sku}</span> • {formatPKR(product.price)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      className="p-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider border border-[#224D26] text-[#224D26] hover:bg-[#224D26] hover:text-white transition-colors shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="bg-[#FAF8F5] border border-[#E8E4DB] p-4 text-xs text-[#555555] space-y-2">
            <h4 className="font-semibold text-[#181818] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#224D26]" />
              Storefront Preview Tip
            </h4>
            <p className="leading-relaxed text-[11.5px]">
              After clicking <strong>Save Section Layout</strong>, your changes are immediately persisted to MongoDB and cached storefront routes are purged. Revisit or refresh the client storefront to view the updated merchandising grid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomepageSectionsView;
