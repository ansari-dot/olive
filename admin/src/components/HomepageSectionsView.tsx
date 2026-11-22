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
  Sparkles,
  Layers,
  Package,
  Upload,
  Check,
  ExternalLink,
} from 'lucide-react';
import type {
  AdminProduct,
  HomepageSectionKey,
  AdminSectionsResponse,
  HeroBannerDoc,
} from '../types/admin';
import {
  fetchAdminSections,
  updateAdminSectionLayout,
  fetchHeroBanner,
  updateHeroBanner,
  uploadAdminImage,
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

type ActiveTab = 'hero' | HomepageSectionKey;

export const HomepageSectionsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hero');
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

  // Hero Banner State
  const [heroForm, setHeroForm] = useState<HeroBannerDoc>({
    label: 'Early Harvest 2026 Collection',
    titleLine1: 'Single-Estate Cold-Pressed',
    titleLine2: 'Extra Virgin Olive Oil',
    text: 'Harvested from sun-drenched Chakwal olive groves. Cold-extracted below 25°C within 4 hours to preserve polyphenols and authentic organoleptic freshness.',
    highlights: '< 0.22% Acidity · Single Terroir · Unfiltered',
    primaryBtnText: 'Shop Harvest Reserve',
    primaryBtnLink: '/shop',
    secondaryBtnText: 'Our Extraction Heritage',
    secondaryBtnLink: '/about',
    offerChip: 'Complimentary Cold-Chain Shipping across Pakistan on orders over PKR 4,000',
    heroImages: [
      '/assets/images/hero_banner_olive_oil_1794764571906.jpg',
      '/assets/images/hero_banner_organic_olives_1794764572190.jpg',
      '/assets/images/hero_banner_raw_honey_1794764573272.jpg',
    ],
  });
  const [newHeroImageUrl, setNewHeroImageUrl] = useState('');
  const [uploadingHeroImg, setUploadingHeroImg] = useState(false);
  const [heroActiveSlideIndex, setHeroActiveSlideIndex] = useState(0);

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [res, heroDoc] = await Promise.all([
        fetchAdminSections(),
        fetchHeroBanner().catch(() => null),
      ]);
      setSectionsData({
        'featured-grid': res.sections['featured-grid'] || [],
        'best-sellers': res.sections['best-sellers'] || [],
        unique: res.sections.unique || [],
        shop: res.sections.shop || [],
      });
      setAllProducts(res.products || []);
      if (heroDoc) {
        setHeroForm((prev) => ({
          ...prev,
          ...heroDoc,
          heroImages:
            heroDoc.heroImages && heroDoc.heroImages.length > 0
              ? heroDoc.heroImages
              : prev.heroImages,
        }));
      }
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
    void loadData();
  }, []);

  const isHeroTab = activeTab === 'hero';
  const currentAssigned = !isHeroTab ? sectionsData[activeTab as HomepageSectionKey] || [] : [];
  const assignedIds = useMemo(() => new Set(currentAssigned.map((p) => p._id)), [currentAssigned]);

  // Total merchandised products across all sections
  const totalMerchandisedCount = useMemo(() => {
    const ids = new Set<string>();
    Object.values(sectionsData).forEach((list) => {
      list.forEach((p) => ids.add(p._id));
    });
    return ids.size;
  }, [sectionsData]);

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
    if (index <= 0 || isHeroTab) return;
    const secKey = activeTab as HomepageSectionKey;
    const updated = [...currentAssigned];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setSectionsData((prev) => ({ ...prev, [secKey]: updated }));
  };

  // Move product down in display sequence
  const handleMoveDown = (index: number) => {
    if (index >= currentAssigned.length - 1 || isHeroTab) return;
    const secKey = activeTab as HomepageSectionKey;
    const updated = [...currentAssigned];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setSectionsData((prev) => ({ ...prev, [secKey]: updated }));
  };

  // Remove product from section
  const handleRemove = (productId: string) => {
    if (isHeroTab) return;
    const secKey = activeTab as HomepageSectionKey;
    const updated = currentAssigned.filter((p) => p._id !== productId);
    setSectionsData((prev) => ({ ...prev, [secKey]: updated }));
  };

  // Add product to section
  const handleAddProduct = (product: AdminProduct) => {
    if (isHeroTab) return;
    const secKey = activeTab as HomepageSectionKey;
    const updated = [...currentAssigned, product];
    setSectionsData((prev) => ({ ...prev, [secKey]: updated }));
  };

  // Save changes to backend MongoDB
  const handleSaveLayout = async () => {
    if (isHeroTab) return;
    const secKey = activeTab as HomepageSectionKey;
    setSaving(true);
    setFeedback(null);
    try {
      const items = currentAssigned.map((p, index) => ({
        productId: p._id,
        order: index + 1,
      }));

      await updateAdminSectionLayout(secKey, items);

      setFeedback({
        type: 'success',
        message: `Saved ${currentAssigned.length} products to "${
          SECTIONS.find((s) => s.key === secKey)?.title
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

  // Save Hero Campaign Banner
  const handleSaveHeroBanner = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await updateHeroBanner(heroForm);
      setFeedback({
        type: 'success',
        message: 'Hero campaign banner and slide imagery saved successfully! Storefront refreshed.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save hero banner',
      });
    } finally {
      setSaving(false);
    }
  };

  // Add hero image URL
  const handleAddHeroImageUrl = () => {
    const trimmed = newHeroImageUrl.trim();
    if (!trimmed) return;
    const currentImgs = heroForm.heroImages || [];
    setHeroForm((prev) => ({
      ...prev,
      heroImages: [...currentImgs, trimmed],
    }));
    setNewHeroImageUrl('');
  };

  // Upload hero image file
  const handleUploadHeroFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHeroImg(true);
    setFeedback(null);
    try {
      const uploadedUrl = await uploadAdminImage(file);
      setHeroForm((prev) => ({
        ...prev,
        heroImages: [...(prev.heroImages || []), uploadedUrl],
      }));
      setFeedback({
        type: 'success',
        message: 'Hero banner slide image uploaded successfully.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to upload hero image',
      });
    } finally {
      setUploadingHeroImg(false);
      e.target.value = '';
    }
  };

  // Remove hero image
  const handleRemoveHeroImage = (index: number) => {
    setHeroForm((prev) => {
      const next = (prev.heroImages || []).filter((_, idx) => idx !== index);
      return { ...prev, heroImages: next };
    });
    if (heroActiveSlideIndex >= (heroForm.heroImages || []).length - 1) {
      setHeroActiveSlideIndex(Math.max(0, (heroForm.heroImages || []).length - 2));
    }
  };

  const activeSectionConfig = !isHeroTab
    ? SECTIONS.find((s) => s.key === activeTab)
    : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-[25px] font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <LayoutGrid className="w-6 h-6 text-[#15472B]" />
            Homepage &amp; Hero Merchandising Console
          </h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Curate storefront hero carousel campaigns and arrange featured collections, best sellers, and rare harvests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading || saving}
            aria-label="Refresh layouts"
            title="Refresh Layouts"
            className="border border-[#E5E9E4] bg-white hover:border-[#0F172A] p-2 rounded-xl text-[#334155] cursor-pointer shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#15472B]' : ''}`} />
          </button>

          {isHeroTab ? (
            <button
              type="button"
              onClick={() => void handleSaveHeroBanner()}
              disabled={saving || loading}
              className="bg-[#0E291C] hover:bg-[#15472B] disabled:bg-[#94A3B8] text-white px-5 py-2 rounded-xl text-[12.5px] font-semibold tracking-wide cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Hero Campaign
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSaveLayout()}
              disabled={saving || loading}
              className="bg-[#0E291C] hover:bg-[#15472B] disabled:bg-[#94A3B8] text-white px-5 py-2 rounded-xl text-[12.5px] font-semibold tracking-wide cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Section Layout
            </button>
          )}
        </div>
      </div>

      {/* Row 1: Top 4 KPI Metric Cards (Matching Dashboard & OrdersView design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Curated Products */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Curated Items</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Across homepage grids</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {totalMerchandisedCount}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">●</span>
              <span>{allProducts.length} total products in catalog</span>
            </p>
          </div>

          {/* Decorative Wave SVG */}
          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,58 C30,52 50,30 80,45 C110,60 125,25 140,32 L140,65 L0,65 Z"
                fill="url(#waveSec1)"
              />
              <defs>
                <linearGradient id="waveSec1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2: Homepage Zones */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Active Zones</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Hero + 4 product rows</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              5 Zones
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">✓</span>
              <span>Fully live on storefront</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M30,62 C60,48 85,22 115,38 C128,45 136,25 140,20 L140,65 L30,65 Z"
                fill="url(#waveSec2)"
              />
              <defs>
                <linearGradient id="waveSec2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BBF7D0" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.08" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 3: Hero Slides */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Hero Slides</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">High-res banner imagery</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {(heroForm.heroImages || []).length} Slides
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">↑</span>
              <span>Auto-rotates at 6s intervals</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M10,65 C40,40 70,60 100,30 C120,45 130,20 140,25 L140,65 Z"
                fill="url(#waveSec3)"
              />
              <defs>
                <linearGradient id="waveSec3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 4: Unassigned Catalog Pool */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Ready in Catalog</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Available for placement</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {availableToAdd.length}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">✓</span>
              <span>Instant 1-click addition</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,60 C40,55 60,35 90,45 C120,55 130,28 140,35 L140,65 Z"
                fill="url(#waveSec4)"
              />
              <defs>
                <linearGradient id="waveSec4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Feedback Alert Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-[13px] flex items-center justify-between border shadow-2xs animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-[#22C55E]" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-[#EF4444]" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[12px] font-semibold underline hover:no-underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Modern Tab Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Tab 1: Hero Banner */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('hero');
            setFeedback(null);
          }}
          className={`text-left p-4 rounded-2xl border transition-all relative cursor-pointer ${
            isHeroTab
              ? 'border-[#15472B] bg-[#F4F9F5] shadow-xs ring-1 ring-[#15472B]'
              : 'border-[#E5E9E4] bg-white hover:border-[#CBD5E1] shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#15472B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Hero Banner
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                isHeroTab ? 'bg-[#15472B] text-white' : 'bg-[#F1F5F9] text-[#475569]'
              }`}
            >
              {(heroForm.heroImages || []).length}
            </span>
          </div>
          <p className="text-[12px] font-semibold text-[#0F172A] line-clamp-1">
            Storefront Carousel
          </p>
          <p className="text-[11px] text-[#64748B] mt-1 line-clamp-1">
            Headlines, slides &amp; CTAs
          </p>
        </button>

        {/* Other Sections */}
        {SECTIONS.map((sec) => {
          const isSelected = activeTab === sec.key;
          const count = (sectionsData[sec.key] || []).length;
          return (
            <button
              key={sec.key}
              type="button"
              onClick={() => {
                setActiveTab(sec.key);
                setFeedback(null);
              }}
              className={`text-left p-4 rounded-2xl border transition-all relative cursor-pointer ${
                isSelected
                  ? 'border-[#15472B] bg-[#F4F9F5] shadow-xs ring-1 ring-[#15472B]'
                  : 'border-[#E5E9E4] bg-white hover:border-[#CBD5E1] shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  {sec.title.split(' ')[0]}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                    isSelected ? 'bg-[#15472B] text-white' : 'bg-[#F1F5F9] text-[#475569]'
                  }`}
                >
                  {count}
                </span>
              </div>
              <p className="text-[12px] font-semibold text-[#0F172A] line-clamp-1">
                {sec.title}
              </p>
              <p className="text-[11px] text-[#64748B] mt-1 line-clamp-1">
                Target: {sec.recommendedCount}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      {isHeroTab ? (
        /* HERO BANNER EDITING & LIVE PREVIEW CANVAS */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Storefront Mockup Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-2xs space-y-4 sticky top-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#15472B]" />
                  Live Storefront Preview
                </h3>
                <span className="text-[11px] font-semibold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                  Interactive Mockup
                </span>
              </div>

              {/* Mockup Frame */}
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-[#1C2818] border border-[#CBD5E1] shadow-lg flex flex-col justify-end p-5 text-white select-none">
                {/* Background Image */}
                {(heroForm.heroImages || []).length > 0 ? (
                  <img
                    src={resolveMediaUrl((heroForm.heroImages || [])[heroActiveSlideIndex] || '')}
                    alt="Hero Preview"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_IMAGE_PLACEHOLDER;
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#283818] to-[#121A0C]" />
                )}

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                {/* Content Overlay */}
                <div className="relative z-10 space-y-2">
                  {heroForm.label && (
                    <span className="inline-block bg-[#D4AF37] text-[#0E291C] text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-xs">
                      {heroForm.label}
                    </span>
                  )}
                  <h4 className="text-[17px] font-bold leading-tight drop-shadow-sm font-serif">
                    {heroForm.titleLine1} <br />
                    <span className="text-[#FBBF24]">{heroForm.titleLine2}</span>
                  </h4>
                  <p className="text-[11px] text-white/85 line-clamp-2 leading-relaxed">
                    {heroForm.text}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="bg-[#15472B] text-white text-[10px] font-semibold px-3 py-1 rounded-sm shadow-xs">
                      {heroForm.primaryBtnText || 'Shop'}
                    </span>
                    <span className="border border-white/60 text-white text-[10px] font-semibold px-3 py-1 rounded-sm">
                      {heroForm.secondaryBtnText || 'Explore'}
                    </span>
                  </div>
                </div>

                {/* Slide indicator dots */}
                {(heroForm.heroImages || []).length > 1 && (
                  <div className="absolute bottom-2.5 right-4 z-20 flex items-center gap-1.5">
                    {(heroForm.heroImages || []).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setHeroActiveSlideIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                          idx === heroActiveSlideIndex
                            ? 'bg-[#FBBF24] w-4'
                            : 'bg-white/50 hover:bg-white'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Offer Chip Display */}
              {heroForm.offerChip && (
                <div className="p-3 bg-[#FAF8F5] border border-[#E8E4DB] rounded-xl flex items-center gap-2 text-[11.5px] text-[#554734]">
                  <Sparkles className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span className="line-clamp-2">{heroForm.offerChip}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Hero Banner Editorial Controls Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-[#E5E9E4] p-6 shadow-2xs space-y-5">
              <div className="border-b border-[#E2E8F0] pb-4">
                <h3 className="text-[16px] font-bold text-[#0F172A] tracking-tight">
                  Hero Campaign Editorial Settings
                </h3>
                <p className="text-[12.5px] text-[#64748B] mt-0.5">
                  Update primary headline copy, promotional ribbons, CTA button deep links, and slide imagery.
                </p>
              </div>

              <div className="space-y-4">
                {/* Campaign Label & Quality Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Campaign Label / Badge
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Early Harvest 2026 Collection"
                      value={heroForm.label || ''}
                      onChange={(e) => setHeroForm((prev) => ({ ...prev, label: e.target.value }))}
                      className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Quality Highlights / Terroir Bullet
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. < 0.22% Acidity · Single Terroir · Unfiltered"
                      value={heroForm.highlights || ''}
                      onChange={(e) => setHeroForm((prev) => ({ ...prev, highlights: e.target.value }))}
                      className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                    />
                  </div>
                </div>

                {/* Headline Line 1 & Line 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Headline Line 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Single-Estate Cold-Pressed"
                      value={heroForm.titleLine1 || ''}
                      onChange={(e) => setHeroForm((prev) => ({ ...prev, titleLine1: e.target.value }))}
                      className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Headline Line 2 (Highlighted) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Extra Virgin Olive Oil"
                      value={heroForm.titleLine2 || ''}
                      onChange={(e) => setHeroForm((prev) => ({ ...prev, titleLine2: e.target.value }))}
                      className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                    />
                  </div>
                </div>

                {/* Narrative Text */}
                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Editorial Narrative Story
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the harvest terroir, aroma, culinary pairing, and pressing technique..."
                    value={heroForm.text || ''}
                    onChange={(e) => setHeroForm((prev) => ({ ...prev, text: e.target.value }))}
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                  />
                </div>

                {/* CTAs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Primary Button Text &amp; Route
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Shop Harvest Reserve"
                        value={heroForm.primaryBtnText || ''}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, primaryBtnText: e.target.value }))}
                        className="w-1/2 border border-[#CBD5E1] rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                      />
                      <input
                        type="text"
                        placeholder="/shop"
                        value={heroForm.primaryBtnLink || ''}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, primaryBtnLink: e.target.value }))}
                        className="w-1/2 border border-[#CBD5E1] rounded-xl px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-[#15472B]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Secondary Button Text &amp; Route
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Our Extraction Heritage"
                        value={heroForm.secondaryBtnText || ''}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, secondaryBtnText: e.target.value }))}
                        className="w-1/2 border border-[#CBD5E1] rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                      />
                      <input
                        type="text"
                        placeholder="/about"
                        value={heroForm.secondaryBtnLink || ''}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, secondaryBtnLink: e.target.value }))}
                        className="w-1/2 border border-[#CBD5E1] rounded-xl px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-[#15472B]"
                      />
                    </div>
                  </div>
                </div>

                {/* Offer Chip */}
                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Promotional Offer Ribbon / Free Shipping Bar
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Complimentary Cold-Chain Shipping across Pakistan on orders over PKR 4,000"
                    value={heroForm.offerChip || ''}
                    onChange={(e) => setHeroForm((prev) => ({ ...prev, offerChip: e.target.value }))}
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                  />
                </div>

                {/* Hero Slide Images Management */}
                <div className="pt-2 border-t border-[#E2E8F0] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-[13px] font-bold text-[#0F172A]">
                        Carousel Slide Imagery ({(heroForm.heroImages || []).length})
                      </label>
                      <p className="text-[11.5px] text-[#64748B]">
                        High-definition 16:9 or panoramic photographs for the storefront banner.
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-1.5 bg-[#FAF8F5] border border-[#CBD5E1] hover:bg-[#F1F5F9] px-3.5 py-1.5 rounded-xl text-[12px] font-semibold text-[#15472B] cursor-pointer shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingHeroImg ? 'Uploading...' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadHeroFile}
                        disabled={uploadingHeroImg}
                      />
                    </label>
                  </div>

                  {/* Add URL Row */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste image path or URL (e.g. /assets/images/hero_banner_olive_oil...)"
                      value={newHeroImageUrl}
                      onChange={(e) => setNewHeroImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddHeroImageUrl();
                        }
                      }}
                      className="flex-1 border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                    <button
                      type="button"
                      onClick={handleAddHeroImageUrl}
                      className="bg-[#15472B] hover:bg-[#0F3620] text-white px-4 py-2 rounded-xl text-[12.5px] font-semibold cursor-pointer shadow-2xs"
                    >
                      Add URL
                    </button>
                  </div>

                  {/* Slides Grid */}
                  {(heroForm.heroImages || []).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {(heroForm.heroImages || []).map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setHeroActiveSlideIndex(idx)}
                          className={`relative group aspect-video rounded-xl overflow-hidden border cursor-pointer transition-all ${
                            idx === heroActiveSlideIndex
                              ? 'border-[#15472B] ring-2 ring-[#15472B]'
                              : 'border-[#CBD5E1] hover:border-[#94A3B8]'
                          }`}
                        >
                          <img
                            src={resolveMediaUrl(imgUrl)}
                            alt={`Slide ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_IMAGE_PLACEHOLDER;
                            }}
                          />
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Slide {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveHeroImage(idx);
                            }}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                            title="Remove slide"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSaveHeroBanner()}
                  disabled={saving || loading}
                  className="bg-[#15472B] hover:bg-[#0F3620] disabled:bg-[#94A3B8] text-white px-6 py-2.5 rounded-xl text-[12.5px] font-semibold tracking-wide cursor-pointer shadow-2xs transition-colors flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Hero Campaign Banner
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PRODUCT SECTION MERCHANDISING CANVAS */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Cols: Ordered Merchandising List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E5E9E4] rounded-2xl p-4 shadow-2xs">
              <div>
                <h3 className="text-[14px] font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#15472B]" />
                  {activeSectionConfig?.title} — Active Display Sequence
                </h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  Products render on the client homepage in the exact numbered order below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDrawer(!showAddDrawer)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#15472B] hover:bg-[#0F3620] text-white text-[12px] font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddDrawer ? 'Hide Catalog Picker' : 'Browse & Add Products'}
              </button>
            </div>

            {currentAssigned.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#CBD5E1] space-y-3">
                <LayoutGrid className="w-9 h-9 text-[#94A3B8] mx-auto" />
                <p className="text-[14px] font-semibold text-[#0F172A]">
                  No products are currently assigned to this section.
                </p>
                <p className="text-[12.5px] text-[#64748B] max-w-md mx-auto">
                  Use the product picker on the right to select which harvest items appear in this homepage area.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddDrawer(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#15472B] text-[#15472B] hover:bg-[#F4F9F5] text-[12px] font-semibold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Browse Catalog to Assign
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E5E9E4] divide-y divide-[#F1F5F9] overflow-hidden shadow-2xs">
                {currentAssigned.map((product, idx) => (
                  <div
                    key={product._id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors"
                  >
                    {/* Sequence Position */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-7 h-7 flex items-center justify-center bg-[#0F3520] text-[#4ADE80] font-bold text-[12px] rounded-xl tabular-nums shrink-0 shadow-inner">
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
                        className="w-12 h-12 object-cover rounded-xl border border-[#E2E8F0] bg-white shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13.5px] font-semibold text-[#0F172A] truncate">
                            {product.name}
                          </span>
                          {!product.isActive && (
                            <span className="px-2 py-0.5 text-[10.5px] bg-[#FEE2E2] text-[#991B1B] font-semibold uppercase rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#64748B] mt-0.5 font-mono-data">
                          <span>{product.sku}</span>
                          <span>·</span>
                          <span>{product.brand}</span>
                          <span>·</span>
                          <span className="font-semibold text-[#0F172A]">
                            {formatPKR(product.price)}
                          </span>
                          <span>·</span>
                          <span>Stock: {product.stock}</span>
                        </div>
                      </div>
                    </div>

                    {/* Move Up / Down & Remove Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1.5 border border-[#CBD5E1] hover:border-[#0F172A] rounded-lg text-[#334155] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === currentAssigned.length - 1}
                        title="Move Down"
                        className="p-1.5 border border-[#CBD5E1] hover:border-[#0F172A] rounded-lg text-[#334155] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(product._id)}
                        title="Remove from Section"
                        className="p-1.5 border border-[#FECACA] hover:bg-[#FEF2F2] rounded-lg text-[#DC2626] cursor-pointer ml-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right 4 Cols: Searchable Catalog Picker */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-2xs space-y-3.5 sticky top-6">
              <h3 className="text-[12.5px] font-bold uppercase tracking-wider text-[#0F172A] flex items-center justify-between">
                <span>Add From Catalog</span>
                <span className="text-[11px] text-[#64748B] font-mono-data">
                  {availableToAdd.length} available
                </span>
              </h3>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, SKU, brand..."
                  className="w-full text-[12.5px] pl-9 pr-3 py-2 border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                />
              </div>

              {/* List of unassigned products */}
              <div className="max-h-[460px] overflow-y-auto divide-y divide-[#F1F5F9] border border-[#E2E8F0] rounded-xl">
                {availableToAdd.length === 0 ? (
                  <div className="p-6 text-center text-[12.5px] text-[#64748B]">
                    {searchQuery ? 'No matching products found.' : 'All catalog products are already assigned.'}
                  </div>
                ) : (
                  availableToAdd.map((product) => (
                    <div
                      key={product._id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors"
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
                          className="w-10 h-10 object-cover rounded-lg border border-[#E2E8F0] bg-white shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-[#0F172A] truncate">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-[#64748B] font-mono-data truncate">
                            <span>{product.sku}</span> · {formatPKR(product.price)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddProduct(product)}
                        className="py-1 px-3 text-[11px] font-semibold uppercase tracking-wider rounded-lg border border-[#15472B] text-[#15472B] hover:bg-[#15472B] hover:text-white transition-colors shrink-0 cursor-pointer shadow-2xs"
                      >
                        + Add
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Help Card */}
              <div className="bg-[#FAF8F5] border border-[#E8E4DB] rounded-xl p-3.5 text-[11.5px] text-[#64748B] space-y-1.5">
                <h4 className="font-semibold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#15472B]" />
                  Storefront Live Sync
                </h4>
                <p className="leading-relaxed">
                  After saving, MongoDB layouts update immediately and cached storefront routes are purged. Visit the live storefront to verify presentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomepageSectionsView;
