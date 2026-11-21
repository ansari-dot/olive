import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import {
  Menu,
  X,
  ChevronDown,
  Search,
  Heart,
  ShoppingCart,
  Truck,
  Loader2,
} from 'lucide-react';
import { fetchProducts } from '../services/api';
import type { Product } from '../data/storeData';

export type NavSection =
  | 'HOME'
  | 'ABOUT US'
  | 'SHOP'
  | 'BLOGS'
  | 'CONTACT US';

export interface NavDepartment {
  name: string;
  categories: { name: string; tag?: string }[];
}

export const DEPARTMENTS_NAV: NavDepartment[] = [
  {
    name: 'Spices & Blends',
    categories: [
      { name: 'Ground Spices' },
      { name: 'Whole Spices' },
      { name: 'Herbs and Botanicals' },
      { name: 'Seasonings and Spice Blends' },
    ],
  },
  {
    name: 'Oils & Olives',
    categories: [
      { name: 'Olive Products', tag: 'EVOO' },
      { name: 'Edible and Specialty Oils' },
      { name: 'Herbal and Botanical Oils' },
      { name: 'Salts and Mineral Ingredients' },
      { name: 'Vinegars' },
    ],
  },
  {
    name: 'Mushrooms & Extracts',
    categories: [
      { name: 'Mushrooms and Mushroom Products', tag: 'Adaptogens' },
      { name: 'Extracts and Concentrates', tag: 'Shilajit' },
    ],
  },
  {
    name: 'Teas & Coffees',
    categories: [
      { name: 'Tea and Herbal Infusions' },
      { name: 'Coffee' },
      { name: 'Beverages and Drink Mixes' },
      { name: 'Instant Drink Mixes' },
    ],
  },
  {
    name: 'Pantry & Raw Honey',
    categories: [
      { name: 'Natural Sweeteners', tag: 'Sidr Honey' },
      { name: 'Nuts' },
      { name: 'Dried Fruits' },
      { name: 'Pickles and Fermented Foods' },
    ],
  },
  {
    name: 'Healthy Snacks',
    categories: [
      { name: 'Healthy Snacks' },
      { name: 'Fruit and Vegetable Snacks' },
      { name: 'Chocolates and Cacao Products' },
      { name: 'Gourmet and Savoury Snacks' },
      { name: 'Biscuits and Cookies' },
      { name: 'Snacks and Convenience Foods' },
    ],
  },
  {
    name: 'Superfoods & Supplements',
    categories: [
      { name: 'Superfoods and Functional Ingredients', tag: 'Moringa' },
      { name: 'Health Nutrition and Functional Foods' },
      { name: 'Nutritional Supplements' },
    ],
  },
];

const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', label: '$ - USD' },
  { code: 'EUR', symbol: '€', label: '€ - EUR' },
  { code: 'PKR', symbol: 'Rs.', label: 'Rs. - PKR' },
  { code: 'AED', symbol: 'AED', label: 'AED - د.إ' },
];

const LANGUAGE_OPTIONS = ['English', 'اردو (Urdu)'];

const COLLECTION_OPTIONS = [
  'All Collection',
  'Ground Spices',
  'Whole Spices',
  'Herbs and Botanicals',
  'Seasonings and Spice Blends',
  'Olive Products',
  'Edible and Specialty Oils',
  'Herbal and Botanical Oils',
  'Mushrooms and Mushroom Products',
  'Extracts and Concentrates',
  'Tea and Herbal Infusions',
  'Coffee',
  'Nuts',
  'Dried Fruits',
  'Natural Sweeteners',
  'Superfoods and Functional Ingredients',
  'Salts and Mineral Ingredients',
  'Vinegars',
  'Pickles and Fermented Foods',
  'Healthy Snacks',
  'Chocolates and Cacao Products',
  'Gourmet and Savoury Snacks',
  'Biscuits and Cookies',
  'Beverages and Drink Mixes',
  'Instant Drink Mixes',
  'Health Nutrition and Functional Foods',
  'Nutritional Supplements',
];

interface NavbarProps {
  activeNav?: NavSection;
  cartCount?: number;
  wishlistCount?: number;
  orderCount?: number;
  featuredProducts?: Product[];
  onSelectNav?: (nav: NavSection) => void;
  onNavigateCategory?: (category: string, subcategory?: string) => void;
  onOpenSearch?: () => void;
  onOpenOrderTracking?: () => void;
  onOpenWishlist?: () => void;
  onOpenCart?: () => void;
  onOpenShipping?: () => void;
  onSelectProduct?: (product: Product) => void;
  onSearchSubmit?: (query: string, category?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = React.memo(({
  activeNav,
  cartCount,
  wishlistCount,
  featuredProducts,
  onSelectNav,
  onNavigateCategory,
  onOpenOrderTracking,
  onOpenWishlist,
  onOpenCart,
  onOpenShipping,
  onSelectProduct,
  onSearchSubmit,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const store = useStore();

  const effectiveCartCount = cartCount !== undefined ? cartCount : store.cartCount;
  const effectiveWishlistCount = wishlistCount !== undefined ? wishlistCount : store.wishlistCount;

  const derivedNav: NavSection = useMemo(() => {
    if (activeNav) return activeNav;
    const p = location.pathname.toLowerCase();
    if (p.startsWith('/about')) return 'ABOUT US';
    if (p.startsWith('/shop') || p.startsWith('/product')) return 'SHOP';
    if (p.startsWith('/blog')) return 'BLOGS';
    if (p.startsWith('/contact')) return 'CONTACT US';
    return 'HOME';
  }, [activeNav, location.pathname]);

  const currentNav = activeNav || derivedNav;

  const handleSelectNavInternal = (nav: NavSection) => {
    if (onSelectNav) {
      onSelectNav(nav);
      return;
    }
    switch (nav) {
      case 'HOME':
        navigate('/');
        break;
      case 'ABOUT US':
        navigate('/about');
        break;
      case 'SHOP':
        navigate('/shop');
        break;
      case 'BLOGS':
        navigate('/blogs');
        break;
      case 'CONTACT US':
        navigate('/contact');
        break;
    }
  };

  const handleOpenCartInternal = () => {
    if (onOpenCart) onOpenCart();
    else store.setCartDrawerOpen(true);
  };

  const handleOpenWishlistInternal = () => {
    if (onOpenWishlist) onOpenWishlist();
    else navigate('/wishlist');
  };

  const handleOpenOrderTrackingInternal = () => {
    if (onOpenOrderTracking) onOpenOrderTracking();
    else navigate('/order-tracking');
  };

  const handleOpenShippingInternal = () => {
    if (onOpenShipping) onOpenShipping();
    else navigate('/shipping-policy');
  };

  const handleSelectProductInternal = (prod: Product) => {
    if (onSelectProduct) {
      onSelectProduct(prod);
    } else {
      navigate(`/product/${prod.slug || prod.id}`);
    }
  };

  const displayProducts =
    featuredProducts && featuredProducts.length > 0
      ? featuredProducts.slice(0, 2)
      : [];
  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedTab, setMobileExpandedTab] = useState<string | null>(null);

  // Desktop Dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('$ - USD');
  const [languageOpen, setLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Language');

  // Search Bar State
  const [selectedCollection, setSelectedCollection] = useState('All Collection');
  const [collectionMenuOpen, setCollectionMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setSearchFocused(false);
        setCollectionMenuOpen(false);
      }
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(target)) {
        setCurrencyOpen(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(target)) {
        setLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search queries with AbortController to cancel stale requests
  useEffect(() => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }

    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const controller = new AbortController();
    searchAbortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const catFilter =
          selectedCollection !== 'All Collection' ? selectedCollection : undefined;
        const res = await fetchProducts(
          { search: q, category: catFilter, limit: 6 },
          { signal: controller.signal }
        );
        setSearchResults(res.products);
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('Navbar search error:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, selectedCollection]);

  const handleDropdownEnter = (name: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setOpenDropdown(name);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  };

  const handleCategoryClick = (categoryName: string, subcategoryName?: string) => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    if (onNavigateCategory) {
      onNavigateCategory(categoryName, subcategoryName);
    } else {
      let url = `/shop?category=${encodeURIComponent(categoryName)}`;
      if (subcategoryName) {
        url += `&subcategory=${encodeURIComponent(subcategoryName)}`;
      }
      navigate(url);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchFocused(false);
    setMobileMenuOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery, selectedCollection);
    } else {
      let url = `/shop?search=${encodeURIComponent(searchQuery)}`;
      if (selectedCollection && selectedCollection !== 'All Collection') {
        url += `&category=${encodeURIComponent(selectedCollection)}`;
      }
      navigate(url);
    }
  };

  return (
    <header className="w-full relative z-30 font-sans">
      {/* =========================================================================
          TIER 1: TOP UTILITY BAR (Light Gray `#F5F5F5` with generous padding)
          ========================================================================= */}
      <div className="w-full bg-[#F5F5F5] border-b border-[#EAEAEA] text-[#666666] text-[12px] py-2.5 sm:py-3 select-none">
        <div className="max-w-[1400px] xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Email & Announcement */}
          <div className="flex items-center gap-2.5 truncate text-[11.5px] sm:text-[12px]">
            <a
              href="mailto:care@pakveda.pk"
              className="hover:text-[#111111] transition-colors font-medium truncate"
            >
              Email:care@pakveda.pk
            </a>
            <span className="text-[#D1D5DB] font-light">|</span>
            <span className="text-[#666666] truncate font-normal">
              Today&apos;s Deal: Sale Off 50%
            </span>
          </div>

          {/* Right: Order Tracking | Currency Dropdown | Language */}
          <div className="flex items-center gap-3 text-[11.5px] sm:text-[12px] shrink-0">
            <button
              type="button"
              onClick={handleOpenOrderTrackingInternal}
              className="hover:text-[#111111] transition-colors cursor-pointer font-medium"
            >
              Order Tracking
            </button>

            <span className="text-[#D1D5DB] font-light">|</span>

            {/* Currency Dropdown Selector (Exact Floating Box in screenshot) */}
            <div ref={currencyMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setCurrencyOpen((p) => !p)}
                className="inline-flex items-center gap-1 hover:text-[#111111] transition-colors cursor-pointer font-medium"
              >
                <span>{selectedCurrency}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    currencyOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {currencyOpen && (
                <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-[#E2E8F0] shadow-xl rounded-xs z-50 py-1 divide-y divide-[#F1F5F9]">
                  {CURRENCY_OPTIONS.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCurrency(c.label);
                        setCurrencyOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-[12px] hover:bg-[#F8FAFC] transition-colors cursor-pointer ${
                        selectedCurrency === c.label
                          ? 'font-bold text-[#15472B]'
                          : 'text-[#475569]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-[#D1D5DB] font-light">|</span>

            {/* Language Dropdown Selector */}
            <div ref={languageMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setLanguageOpen((p) => !p)}
                className="inline-flex items-center gap-1 hover:text-[#111111] transition-colors cursor-pointer font-medium"
              >
                <span>{selectedLanguage}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    languageOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {languageOpen && (
                <div className="absolute right-0 top-full mt-2 w-28 bg-white border border-[#E2E8F0] shadow-xl rounded-xs z-50 py-1">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setLanguageOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-[11.5px] hover:bg-[#F8FAFC] text-[#475569] hover:text-[#111111] transition-colors cursor-pointer"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TIER 2: MIDDLE HEADER + INTEGRATED BOUNDARY NAVIGATION BAR
          The white background extends down to the exact centerline of Tier 3!
          ========================================================================= */}
      <div className="w-full bg-white pt-5 sm:pt-6 pb-0">
        <div className="max-w-[1400px] xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-5 sm:gap-8 lg:gap-12">
          {/* Mobile Menu Hamburger (Visible < lg) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile menu"
            className="lg:hidden p-1.5 -ml-1 text-[#111111] hover:text-[#15472B] cursor-pointer"
          >
            <Menu className="w-6 h-6 stroke-[1.8]" />
          </button>

          {/* Left Brand Logo: Scaled Up Image Form */}
          <div
            onClick={() => {
              handleSelectNavInternal('HOME');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0 group py-1"
          >
            <img
              src="/assets/images/pak_veda_logo.svg"
              alt="Pak Veda"
              className="h-12 sm:h-14 lg:h-[62px] w-auto object-contain transition-transform group-hover:scale-102"
            />
          </div>

          {/* Center: Unified Search Bar with Category Dropdown */}
          <div
            ref={searchBoxRef}
            className="hidden sm:flex flex-1 max-w-[560px] xl:max-w-[680px] relative items-center border border-[#D1D5DB] rounded-xs h-[44px] bg-white transition-all focus-within:border-[#15472B] focus-within:ring-1 focus-within:ring-[#15472B]/20"
          >
            {/* Category Dropdown (All Collection ▾) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setCollectionMenuOpen((p) => !p)}
                className="h-full px-3.5 py-2 inline-flex items-center gap-2 text-[12.5px] font-medium text-[#334155] hover:text-[#0F172A] whitespace-nowrap cursor-pointer select-none"
              >
                <span className="max-w-[125px] truncate">{selectedCollection}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${
                    collectionMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {collectionMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 max-h-[380px] overflow-y-auto bg-white border border-[#E2E8F0] shadow-xl rounded-xs z-50 py-1.5 divide-y divide-[#F1F5F9]">
                  {COLLECTION_OPTIONS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => {
                        setSelectedCollection(col);
                        setCollectionMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-[12px] hover:bg-[#F8FAFC] transition-colors cursor-pointer truncate ${
                        selectedCollection === col
                          ? 'font-bold text-[#15472B] bg-[#F0FDF4]'
                          : 'text-[#334155]'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vertical Divider Line */}
            <div className="h-5 w-[1px] bg-[#E2E8F0] shrink-0" aria-hidden="true" />

            {/* Text Input (I'm searching for...) */}
            <form onSubmit={handleSearchSubmit} className="flex-1 h-full flex items-center">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="I'm searching for..."
                className="w-full h-full px-3.5 text-[13.5px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none bg-transparent"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="px-3.5 h-full flex items-center justify-center text-[#64748B] hover:text-[#15472B] cursor-pointer"
              >
                <Search className="w-4 h-4 stroke-[2]" />
              </button>
            </form>

            {/* Live Auto-Complete Results Dropdown */}
            {searchFocused && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#E2E8F0] shadow-2xl rounded-xs z-50 overflow-hidden divide-y divide-[#F1F5F9]">
                {searching ? (
                  <div className="p-5 text-center text-[12.5px] text-[#64748B] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#15472B]" />
                    <span>Searching catalog...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-[12.5px] text-[#64748B]">
                    No items found matching &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  <>
                    <div className="p-2 divide-y divide-[#F8FAFC]">
                      {searchResults.slice(0, 5).map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setSearchFocused(false);
                            handleSelectProductInternal(prod);
                          }}
                          className="p-2.5 flex items-center justify-between gap-3 hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-9 h-11 object-cover rounded-2xs bg-[#FAF3F0] shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-[10.5px] uppercase tracking-[0.06em] text-[#64748B] truncate">
                                {prod.brand} · {prod.category}
                              </p>
                              <p className="text-[13px] font-semibold text-[#0F172A] truncate">
                                {prod.name}
                              </p>
                            </div>
                          </div>
                          <span className="text-[12.5px] font-bold text-[#15472B] shrink-0 font-mono-data">
                            Rs. {prod.price.toLocaleString('en-PK')}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="w-full py-2.5 bg-[#FAF8F5] hover:bg-[#F5F2ED] text-[11.5px] uppercase tracking-[0.07em] font-semibold text-[#15472B] text-center cursor-pointer"
                    >
                      View all results &rarr;
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons: Wishlist & Cart with Red Badges */}
          <div className="flex items-center gap-5 sm:gap-6 shrink-0">
            {/* Wishlist Icon */}
            <button
              type="button"
              onClick={handleOpenWishlistInternal}
              aria-label={`Wishlist (${effectiveWishlistCount} items)`}
              className="relative p-1 text-[#0F172A] hover:text-[#C46B3B] transition-colors cursor-pointer"
            >
              <Heart className="w-6 h-6 stroke-[1.6]" />
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E52E2E] text-white text-[10.5px] font-bold flex items-center justify-center leading-none">
                {effectiveWishlistCount}
              </span>
            </button>

            {/* Cart Icon */}
            <button
              type="button"
              onClick={handleOpenCartInternal}
              aria-label={`Shopping cart (${effectiveCartCount} items)`}
              className="relative p-1 text-[#0F172A] hover:text-[#15472B] transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-6 h-6 stroke-[1.6]" />
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E52E2E] text-white text-[10.5px] font-bold flex items-center justify-center leading-none">
                {effectiveCartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Vertical breathing space between Search Bar and Navigation Bar */}
        <div className="h-4 sm:h-5 lg:h-6" />

        {/* =========================================================================
            TIER 3: CENTERED BOXED NAVIGATION BAR (Brand Forest Green `#15472B`)
            Straddles the exact boundary line between the white Header & the Hero Section:
            Top 50% sits in the white Header, bottom 50% hangs down over the Hero Section!
            ========================================================================= */}
        <div className="max-w-[1400px] xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 translate-y-1/2 relative z-30">
          <nav
            aria-label="Main Store Navigation"
            className="w-full bg-[#15472B] text-white h-[48px] lg:h-[50px] flex items-center justify-between pl-4 sm:pl-7 pr-0 relative select-none shadow-[0_6px_20px_rgba(0,0,0,0.22)] overflow-visible"
          >
            {/* Mobile View (< lg): Quick Menu Button */}
            <div className="flex lg:hidden items-center h-full">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center gap-2 text-[12px] font-bold tracking-wide uppercase text-white hover:text-[#A8DC72] transition-colors cursor-pointer"
              >
                <Menu className="w-4 h-4" />
                <span>Browse Menu</span>
              </button>
            </div>
            {/* Left Navigation Links: HOME | ABOUT US | SHOP | BLOGS ▾ | CONTACT US */}
            <div className="hidden lg:flex items-center gap-7 xl:gap-9 h-full text-[13px] font-bold uppercase tracking-[0.05em]">
              {/* 1. HOME (Direct Click, No Dropdown) */}
              <button
                type="button"
                onClick={() => handleSelectNavInternal('HOME')}
                className={`h-full inline-flex items-center hover:text-[#A8DC72] transition-colors cursor-pointer select-none ${
                  currentNav === 'HOME'
                    ? 'text-white border-b-2 border-[#A8DC72]'
                    : 'text-white'
                }`}
              >
                <span>HOME</span>
              </button>

              {/* 2. ABOUT US (Direct Click, No Dropdown) */}
              <button
                type="button"
                onClick={() => handleSelectNavInternal('ABOUT US')}
                className={`h-full inline-flex items-center hover:text-[#A8DC72] transition-colors cursor-pointer select-none ${
                  currentNav === 'ABOUT US'
                    ? 'text-white border-b-2 border-[#A8DC72]'
                    : 'text-white'
                }`}
              >
                <span>ABOUT US</span>
              </button>

              {/* 3. SHOP with Mega Menu Dropdown */}
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => handleDropdownEnter('SHOP')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    handleSelectNavInternal('SHOP');
                  }}
                  className={`h-full inline-flex items-center gap-1.5 px-3.5 transition-colors cursor-pointer select-none font-bold uppercase tracking-[0.05em] ${
                    openDropdown === 'SHOP'
                      ? 'bg-[#E52E2E] text-white'
                      : currentNav === 'SHOP'
                      ? 'text-white border-b-2 border-[#A8DC72]'
                      : 'text-white hover:text-[#A8DC72]'
                  }`}
                >
                  <span>SHOP</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 stroke-[2.5] transition-transform duration-150 ${
                      openDropdown === 'SHOP' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* 4. BLOGS ▾ (Keeps Dropdown Menu) */}
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => handleDropdownEnter('BLOGS')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  type="button"
                  onClick={() => handleSelectNavInternal('BLOGS')}
                  className={`h-full inline-flex items-center gap-1.5 hover:text-[#A8DC72] transition-colors cursor-pointer select-none ${
                    currentNav === 'BLOGS'
                      ? 'text-white border-b-2 border-[#A8DC72]'
                      : 'text-white'
                  }`}
                >
                  <span>BLOGS</span>
                  <ChevronDown className="w-3 h-3 stroke-[2.5]" />
                </button>

                {openDropdown === 'BLOGS' && (
                  <div className="absolute left-0 top-full mt-1 w-60 bg-white text-[#1E293B] border border-[#CBD5E1] shadow-2xl rounded-xs py-2 z-50 divide-y divide-[#F1F5F9]">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectNavInternal('BLOGS');
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 text-[12.5px] font-medium hover:bg-[#F8FAFC] hover:text-[#15472B] transition-colors cursor-pointer"
                      >
                        All Journal Articles
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectNavInternal('BLOGS');
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 text-[12.5px] font-medium hover:bg-[#F8FAFC] hover:text-[#15472B] transition-colors cursor-pointer"
                      >
                        Olive Harvest Science &amp; Health
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectNavInternal('BLOGS');
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 text-[12.5px] font-medium hover:bg-[#F8FAFC] hover:text-[#15472B] transition-colors cursor-pointer"
                      >
                        Himalayan Shilajit Purity Guide
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectNavInternal('BLOGS');
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 text-[12.5px] font-medium hover:bg-[#F8FAFC] hover:text-[#15472B] transition-colors cursor-pointer"
                      >
                        Kasur Spices &amp; High Curcumin
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. CONTACT US (Direct Click, No Dropdown) */}
              <button
                type="button"
                onClick={() => handleSelectNavInternal('CONTACT US')}
                className={`h-full inline-flex items-center hover:text-[#A8DC72] transition-colors cursor-pointer select-none ${
                  currentNav === 'CONTACT US'
                    ? 'text-white border-b-2 border-[#A8DC72]'
                    : 'text-white'
                }`}
              >
                <span>CONTACT US</span>
              </button>
            </div>

            {/* Right Distinct Highlight Block: Free Shipping (#E52E2E) */}
            <button
              type="button"
              onClick={handleOpenShippingInternal}
              className="h-full bg-[#E52E2E] hover:bg-[#D62828] text-white px-5 sm:px-6 lg:px-7 flex items-center gap-2.5 transition-colors cursor-pointer select-none shrink-0"
            >
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                <span className="text-[#E52E2E] text-[9.5px] font-black uppercase tracking-tighter leading-none border border-[#E52E2E] rounded-2xs px-1 py-0.5">
                  FREE
                </span>
              </div>
              <span className="text-[13px] font-bold tracking-[0.03em] whitespace-nowrap">
                Free Shipping
              </span>
            </button>

            {/* Mega Menu Dropdown for SHOP ▾ (Full Width Across Navbar) */}
            {openDropdown === 'SHOP' && (
              <div
                className="absolute left-0 right-0 top-full mt-0 bg-white text-[#1E293B] border border-[#E5E7EB] shadow-[0_16px_40px_rgba(0,0,0,0.2)] z-50 p-6 sm:p-7 lg:p-8 select-none"
                onMouseEnter={() => handleDropdownEnter('SHOP')}
                onMouseLeave={handleDropdownLeave}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7 lg:gap-8 xl:gap-9 text-left">
                  {/* Column 1: Spices & Seasonings */}
                  <div>
                    <h4 className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#111827]">
                      Spices &amp; Seasonings
                    </h4>
                    <div className="w-9 h-[2.5px] bg-[#E52E2E] mt-1.5 mb-3.5" />
                    <ul className="space-y-1.5">
                      {[
                        { label: 'Basic Ground Spices', cat: 'Ground Spices', sub: 'Basic Ground Spices' },
                        { label: 'Aromatic Ground Spices', cat: 'Ground Spices', sub: 'Aromatic Ground Spices' },
                        { label: 'Specialty Ground Spices', cat: 'Ground Spices', sub: 'Specialty Ground Spices' },
                        { label: 'Whole Aromatic Spices', cat: 'Whole Spices', sub: 'Whole Aromatic Spices' },
                        { label: 'Whole Seeds & Peppercorns', cat: 'Whole Spices', sub: 'Whole Seeds and Peppercorns' },
                        { label: 'Traditional Pakistani Masalas', cat: 'Seasonings and Spice Blends', sub: 'Traditional Pakistani Spice Blends' },
                        { label: 'International Seasonings', cat: 'Seasonings and Spice Blends', sub: 'International Seasonings' },
                      ].map((item) => (
                        <li key={item.label}>
                          <button
                            type="button"
                            onClick={() => handleCategoryClick(item.cat, item.sub)}
                            className="w-full text-left py-1 text-[13px] text-[#4B5563] hover:text-[#E52E2E] hover:translate-x-1 transition-all cursor-pointer font-normal truncate block"
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 2: Cold-Pressed Oils & Olives */}
                  <div>
                    <h4 className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#111827]">
                      Cold-Pressed Oils
                    </h4>
                    <div className="w-9 h-[2.5px] bg-[#E52E2E] mt-1.5 mb-3.5" />
                    <ul className="space-y-1.5">
                      {[
                        { label: 'Early Harvest EVOO', cat: 'Olive Products', sub: 'Early Harvest Extra Virgin Olive Oil (EVOO)' },
                        { label: 'Monovarietal EVOO (Koroneiki & Picual)', cat: 'Olive Products', sub: 'Monovarietal Extra Virgin Olive Oil (EVOO)' },
                        { label: 'Multivarietal EVOO', cat: 'Olive Products', sub: 'Multivarietal Extra Virgin Olive Oil (EVOO)' },
                        { label: 'Cold-Pressed Seed Oils (Kalonji)', cat: 'Edible and Specialty Oils', sub: 'Seed Oils' },
                        { label: 'Nut & Fruit Oils (Almond & Walnut)', cat: 'Edible and Specialty Oils', sub: 'Nut and Fruit Oils' },
                        { label: 'Traditional Herbal & Hair Oils', cat: 'Herbal and Botanical Oils', sub: 'Traditional Herbal Oils' },
                        { label: 'Table Olives & Tapenade', cat: 'Olive Products', sub: 'Table olives' },
                      ].map((item) => (
                        <li key={item.label}>
                          <button
                            type="button"
                            onClick={() => handleCategoryClick(item.cat, item.sub)}
                            className="w-full text-left py-1 text-[13px] text-[#4B5563] hover:text-[#E52E2E] hover:translate-x-1 transition-all cursor-pointer font-normal truncate block"
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 3: Botanicals & Pantry */}
                  <div>
                    <h4 className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#111827]">
                      Botanicals &amp; Honey
                    </h4>
                    <div className="w-9 h-[2.5px] bg-[#E52E2E] mt-1.5 mb-3.5" />
                    <ul className="space-y-1.5">
                      {[
                        { label: 'Himalayan Shilajit Resin', cat: 'Extracts and Concentrates', sub: 'Shilajit Products' },
                        { label: 'Functional Mushrooms (Lion’s Mane)', cat: 'Mushrooms and Mushroom Products', sub: 'Mushroom Powders' },
                        { label: 'Wild Mountain Raw Sidr Honey', cat: 'Natural Sweeteners', sub: 'Natural Honey' },
                        { label: 'Artisanal Loose Leaf Teas', cat: 'Tea and Herbal Infusions', sub: 'Traditional Teas' },
                        { label: 'Culinary Herbs & Botanicals', cat: 'Herbs and Botanicals', sub: 'Culinary Herbs' },
                        { label: 'Organic Sun-Dried Fruits & Dates', cat: 'Dried Fruits', sub: 'Dates' },
                        { label: 'Himalayan Pink Rock Salt', cat: 'Salts and Mineral Ingredients', sub: 'Himalayan Salts' },
                      ].map((item) => (
                        <li key={item.label}>
                          <button
                            type="button"
                            onClick={() => handleCategoryClick(item.cat, item.sub)}
                            className="w-full text-left py-1 text-[13px] text-[#4B5563] hover:text-[#E52E2E] hover:translate-x-1 transition-all cursor-pointer font-normal truncate block"
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 4: LATEST PRODUCTS matching reference image */}
                  <div>
                    <h4 className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#111827]">
                      Latest Products
                    </h4>
                    <div className="w-9 h-[2.5px] bg-[#E52E2E] mt-1.5 mb-3.5" />
                    {displayProducts.length > 0 ? (
                      <div className="space-y-3">
                        {displayProducts.map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => {
                              setOpenDropdown(null);
                              handleSelectProductInternal(prod);
                            }}
                            className="flex items-center gap-3.5 p-2 rounded-xs hover:bg-[#FAF8F5] transition-colors cursor-pointer group border border-transparent hover:border-[#F1ECE4]"
                          >
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-[66px] h-[66px] object-cover rounded-2xs bg-[#FAF5F0] border border-[#EAE5DE] shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[12.5px] font-semibold text-[#1F2937] group-hover:text-[#15472B] line-clamp-2 leading-snug">
                                {prod.name}
                              </p>
                              <div className="flex items-center gap-0.5 my-1" aria-label="5 out of 5 stars">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <svg
                                    key={s}
                                    viewBox="0 0 16 16"
                                    className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]"
                                  >
                                    <path d="M8 1.4L9.95 5.35L14.3 5.98L11.15 9.05L11.89 13.38L8 11.33L4.11 13.38L4.85 9.05L1.7 5.98L6.05 5.35L8 1.4Z" />
                                  </svg>
                                ))}
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-[13px] font-bold text-[#E52E2E] font-mono-data">
                                  Rs. {prod.price.toLocaleString('en-PK')}
                                </span>
                                {prod.originalPrice && (
                                  <span className="text-[11px] text-[#9CA3AF] line-through font-mono-data">
                                    Rs. {prod.originalPrice.toLocaleString('en-PK')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-7 px-4 text-center border border-dashed border-[#E5E7EB] rounded-xs bg-[#FAF8F5]">
                        <p className="text-[13px] font-semibold text-[#374151]">No products yet added</p>
                        <p className="text-[11.5px] text-[#9CA3AF] mt-1">Fresh artisanal harvests coming soon.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* =========================================================================
          MOBILE SLIDE-OVER DRAWER (Responsive < lg)
          ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-[320px] bg-white h-full shadow-2xl flex flex-col z-10">
            {/* Header */}
            <div className="p-4 bg-[#15472B] text-white flex items-center justify-between">
              <img
                src="/assets/images/pak_veda_logo_white.svg"
                alt="Pak Veda"
                className="h-8 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-white hover:text-[#A8DC72] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-3 border-b border-[#E2E8F0] bg-[#FAF8F5]">
              <form onSubmit={handleSearchSubmit} className="flex items-center bg-white border border-[#CBD5E1] rounded-xs px-2.5 py-1.5">
                <input
                  type="text"
                  placeholder="I'm searching for..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-[12.5px] outline-none text-[#1E293B]"
                />
                <button type="submit" className="text-[#64748B] p-1">
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Links: HOME | ABOUT US | SHOP | BLOGS (accordion) | CONTACT US | ORDER TRACKING */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-[13px] font-semibold text-[#1E293B]">
              <button
                type="button"
                onClick={() => {
                  handleSelectNavInternal('HOME');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2.5 border-b border-[#F1F5F9] hover:text-[#15472B] transition-colors cursor-pointer"
              >
                HOME
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectNavInternal('ABOUT US');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2.5 border-b border-[#F1F5F9] hover:text-[#15472B] transition-colors cursor-pointer"
              >
                ABOUT US
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectNavInternal('SHOP');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2.5 border-b border-[#F1F5F9] hover:text-[#15472B] transition-colors cursor-pointer"
              >
                SHOP
              </button>

              {/* Blogs Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setMobileExpandedTab((p) => (p === 'BLOGS' ? null : 'BLOGS'))
                  }
                  className="w-full flex items-center justify-between py-2.5 border-b border-[#F1F5F9] hover:text-[#15472B] transition-colors cursor-pointer"
                >
                  <span>BLOGS</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      mobileExpandedTab === 'BLOGS' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {mobileExpandedTab === 'BLOGS' && (
                  <div className="pl-3 py-2 space-y-2 bg-[#FAF8F5] rounded-xs my-1 text-[12px]">
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectNavInternal('BLOGS');
                        setMobileMenuOpen(false);
                      }}
                      className="text-[#475569] hover:text-[#15472B] text-left w-full py-1"
                    >
                      All Journal Articles
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectNavInternal('BLOGS');
                        setMobileMenuOpen(false);
                      }}
                      className="text-[#475569] hover:text-[#15472B] text-left w-full py-1"
                    >
                      Olive Harvest Science &amp; Health
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectNavInternal('BLOGS');
                        setMobileMenuOpen(false);
                      }}
                      className="text-[#475569] hover:text-[#15472B] text-left w-full py-1"
                    >
                      Himalayan Shilajit Purity Guide
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  handleSelectNavInternal('CONTACT US');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2.5 border-b border-[#F1F5F9] hover:text-[#15472B] transition-colors cursor-pointer"
              >
                CONTACT US
              </button>

              <button
                type="button"
                onClick={() => {
                  handleOpenOrderTrackingInternal();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2.5 border-b border-[#F1F5F9] hover:text-[#15472B] transition-colors cursor-pointer"
              >
                ORDER TRACKING
              </button>
            </div>

            {/* Mobile Footer Banner */}
            <div
              onClick={() => {
                handleOpenShippingInternal();
                setMobileMenuOpen(false);
              }}
              className="p-3 bg-[#E52E2E] text-white flex items-center justify-center gap-2 cursor-pointer font-bold text-[12.5px]"
            >
              <Truck className="w-4 h-4" />
              <span>Free Shipping Over Rs. 1,200</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});
