import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Loader2, ShoppingBag, Eye } from 'lucide-react';
import { Product } from '../data/storeData';
import { getCleanImage } from './FeaturedProductsSection';
import {
  fetchProducts,
  fetchProductFilters,
  fetchCategories,
  ProductFiltersResponse,
  CategoryItem,
} from '../services/api';

interface ShopPageProps {
  products?: Product[];
  wishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
  selectedBrand?: string;
  initialCategory?: string;
  initialSubcategory?: string;
  onClearBrand?: () => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
  onNavigateHome: () => void;
}

type SortOption = 'default' | 'popularity' | 'rating' | 'price-asc' | 'price-desc';

const formatPKR = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

const StarRating: React.FC<{ rating?: number }> = ({ rating = 4 }) => (
  <div className="flex items-center justify-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((star) => {
      const filled = star <= rating;
      return (
        <svg
          key={star}
          viewBox="0 0 16 16"
          className="w-[12px] h-[12px] text-[#C46B3B]"
          fill={filled ? 'currentColor' : 'none'}
          aria-hidden="true"
        >
          <path
            d="M8 1.4L9.95 5.35L14.3 5.98L11.15 9.05L11.89 13.38L8 11.33L4.11 13.38L4.85 9.05L1.7 5.98L6.05 5.35L8 1.4Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    })}
  </div>
);

const StarRatingLeft: React.FC<{ rating?: number }> = ({ rating = 5 }) => (
  <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((star) => {
      const filled = star <= rating;
      return (
        <svg
          key={star}
          viewBox="0 0 16 16"
          className="w-[10px] h-[10px] text-[#C46B3B]"
          fill={filled ? 'currentColor' : 'none'}
          aria-hidden="true"
        >
          <path
            d="M8 1.4L9.95 5.35L14.3 5.98L11.15 9.05L11.89 13.38L8 11.33L4.11 13.38L4.85 9.05L1.7 5.98L6.05 5.35L8 1.4Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    })}
  </div>
);

export const ShopPage: React.FC<ShopPageProps> = React.memo(({
  wishlistIds = [],
  onToggleWishlist,
  selectedBrand = 'All Brands',
  initialCategory = 'All',
  initialSubcategory = 'All',
  onClearBrand,
  onAddToCart,
  onSelectProduct,
  onNavigateHome,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(initialSubcategory);
  const [catalogCategories, setCatalogCategories] = useState<CategoryItem[]>([]);
  const [selectedFlavour, setSelectedFlavour] = useState<string>('All');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('All');
  const [sliderMaxPrice, setSliderMaxPrice] = useState<number>(5500);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number>(5500);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Live API data state
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [filterMeta, setFilterMeta] = useState<ProductFiltersResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load filter metadata once on mount
  useEffect(() => {
    let isMounted = true;
    fetchProductFilters()
      .then((data) => {
        if (isMounted) {
          setFilterMeta(data);
          const maxP = data.maxPrice || data.priceRange?.max;
          if (maxP && maxP > 5500) {
            setSliderMaxPrice(maxP);
            setAppliedMaxPrice(maxP);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load product filters:', err);
      });

    fetchCategories()
      .then((cats) => {
        if (isMounted) setCatalogCategories(cats);
      })
      .catch((err) => {
        console.error('Failed to load catalog categories:', err);
      });

    // Also fetch popular products for sidebar
    fetchProducts({ sort: 'popularity', limit: 2 })
      .then((res) => {
        if (isMounted) {
          setPopularProducts(res.products);
        }
      })
      .catch((err) => {
        console.error('Failed to load popular products:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync category when prop changes
  useEffect(() => {
    setSelectedCategory(initialCategory);
    setSelectedSubcategory(initialSubcategory || 'All');
    setCurrentPage(1);
  }, [initialCategory, initialSubcategory]);

  // Fetch products whenever filters, sort or page change
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        subcategory: selectedSubcategory !== 'All' ? selectedSubcategory : undefined,
        brand: selectedBrand !== 'All Brands' ? selectedBrand : undefined,
        flavour: selectedFlavour !== 'All' ? selectedFlavour : undefined,
        origin: selectedOrigin !== 'All' ? selectedOrigin : undefined,
        maxPrice: appliedMaxPrice < 5500 ? appliedMaxPrice : undefined,
        sort: sortBy,
        page: currentPage,
        limit: 9,
      });
      setProductsList(res.products);
      setTotalProducts(res.total);
      setTotalPages(Math.max(1, res.totalPages));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load products';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    selectedCategory,
    selectedSubcategory,
    selectedBrand,
    selectedFlavour,
    selectedOrigin,
    appliedMaxPrice,
    sortBy,
    currentPage,
  ]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = ['All', ...(filterMeta?.categories || [])];
  const flavours = filterMeta?.flavours || [];
  const origins = filterMeta?.origins || [];

  const hasActiveFilters =
    selectedBrand !== 'All Brands' ||
    selectedCategory !== 'All' ||
    selectedSubcategory !== 'All' ||
    selectedFlavour !== 'All' ||
    selectedOrigin !== 'All' ||
    appliedMaxPrice < 5500;

  const resetAllFilters = () => {
    onClearBrand?.();
    setSelectedCategory('All');
    setSelectedSubcategory('All');
    setSelectedFlavour('All');
    setSelectedOrigin('All');
    setSliderMaxPrice(5500);
    setAppliedMaxPrice(5500);
    setCurrentPage(1);
  };

  const startIdx = (currentPage - 1) * 9;

  return (
    <main className="w-full bg-white py-10 sm:py-12 lg:py-14">
      <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Top Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-[12.5px] text-[#777777] flex items-center flex-wrap gap-1.5">
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-[#181818] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSelectedSubcategory('All');
              setCurrentPage(1);
            }}
            className={`${selectedCategory === 'All' ? 'text-[#181818] font-medium' : 'hover:text-[#181818]'} cursor-pointer`}
          >
            Shop
          </button>
          {selectedCategory !== 'All' && (
            <>
              <span aria-hidden="true">/</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedSubcategory('All');
                  setCurrentPage(1);
                }}
                className={`${selectedSubcategory === 'All' ? 'text-[#181818] font-medium' : 'hover:text-[#181818]'} cursor-pointer`}
              >
                {selectedCategory}
              </button>
            </>
          )}
          {selectedSubcategory !== 'All' && (
            <>
              <span aria-hidden="true">/</span>
              <span className="text-[#181818] font-medium">{selectedSubcategory}</span>
            </>
          )}
        </nav>

        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((prev) => !prev)}
            className="border border-[#181818] bg-white px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#181818] cursor-pointer"
          >
            {mobileFiltersOpen ? 'HIDE FILTERS' : 'SHOW FILTERS'}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[12px] uppercase tracking-[0.06em] text-[#C46B3B] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* 2-Column Shop Layout: Left Filters + Right Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Filter Sidebar */}
          <aside
            aria-label="Product filters"
            className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block lg:col-span-3 space-y-8`}
          >
            {/* Categories */}
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[19px] font-normal text-[#181818]">Categories</h2>
                <span className="text-[11px] text-[#888888] uppercase tracking-[0.05em]">28 Ranges</span>
              </div>
              <ul className="space-y-1 text-[13px] text-[#555555] max-h-[500px] overflow-y-auto pr-1">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedSubcategory('All');
                      setCurrentPage(1);
                    }}
                    className={`w-full inline-flex items-center gap-2.5 text-left py-1 transition-colors cursor-pointer ${
                      selectedCategory === 'All'
                        ? 'text-[#143320] font-semibold'
                        : 'text-[#555555] hover:text-[#181818]'
                    }`}
                  >
                    <span
                      className={`w-[4px] h-[4px] shrink-0 ${
                        selectedCategory === 'All' ? 'bg-[#143320]' : 'bg-[#C46B3B]'
                      }`}
                      aria-hidden="true"
                    />
                    <span>All 28 Categories</span>
                  </button>
                </li>
                {categories
                  .filter((cat) => cat !== 'All')
                  .map((cat) => {
                    const isActive = selectedCategory === cat;
                    const catDoc = catalogCategories.find((c) => c.name === cat);
                    const subcats = catDoc?.subcategories || [];

                    return (
                      <li key={cat} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (isActive) {
                              setSelectedCategory(cat);
                            } else {
                              setSelectedCategory(cat);
                              setSelectedSubcategory('All');
                            }
                            setCurrentPage(1);
                          }}
                          className={`w-full inline-flex items-center justify-between text-left py-1 transition-colors cursor-pointer ${
                            isActive
                              ? 'text-[#143320] font-semibold'
                              : 'text-[#555555] hover:text-[#181818]'
                          }`}
                        >
                          <span className="inline-flex items-center gap-2 truncate">
                            <span
                              className={`w-[4px] h-[4px] shrink-0 ${
                                isActive ? 'bg-[#143320]' : 'bg-[#C46B3B]'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="truncate">{cat}</span>
                          </span>
                          {catDoc?.count !== undefined && catDoc.count > 0 && (
                            <span className="text-[10.5px] text-[#888888] tabular-nums shrink-0 ml-1">
                              ({catDoc.count})
                            </span>
                          )}
                        </button>

                        {/* Subcategories dropdown when category is active */}
                        {isActive && subcats.length > 0 && (
                          <ul className="ml-3.5 pl-2 border-l border-[#143320]/30 space-y-1 py-1">
                            <li>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSubcategory('All');
                                  setCurrentPage(1);
                                }}
                                className={`text-[12px] block py-0.5 text-left cursor-pointer ${
                                  selectedSubcategory === 'All'
                                    ? 'text-[#143320] font-medium underline'
                                    : 'text-[#777777] hover:text-[#111111]'
                                }`}
                              >
                                All {cat}
                              </button>
                            </li>
                            {subcats.map((sub) => {
                              const isSubActive = selectedSubcategory === sub.name;
                              return (
                                <li key={sub.name}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSubcategory(sub.name);
                                      setCurrentPage(1);
                                    }}
                                    className={`text-[12px] w-full text-left flex items-center justify-between py-0.5 cursor-pointer ${
                                      isSubActive
                                        ? 'text-[#143320] font-medium'
                                        : 'text-[#666666] hover:text-[#111111]'
                                    }`}
                                  >
                                    <span className="truncate">{sub.name}</span>
                                    {sub.count !== undefined && sub.count > 0 && (
                                      <span className="text-[10px] text-[#999999] ml-1 shrink-0">
                                        ({sub.count})
                                      </span>
                                    )}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </div>

            {/* Flavour */}
            {flavours.length > 0 && (
              <div>
                <h2 className="text-[19px] font-normal text-[#181818] mb-3.5">Flavour</h2>
                <ul className="space-y-2 text-[13px] text-[#555555]">
                  {flavours.map(({ name: flavour, count }) => {
                    const isActive = selectedFlavour === flavour;
                    return (
                      <li key={flavour}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFlavour((prev) => (prev === flavour ? 'All' : flavour));
                            setCurrentPage(1);
                          }}
                          className={`inline-flex items-center gap-2.5 text-left transition-colors cursor-pointer tabular-nums ${
                            isActive
                              ? 'text-[#181818] font-medium'
                              : 'text-[#555555] hover:text-[#181818]'
                          }`}
                        >
                          <span
                            className="w-[4px] h-[4px] bg-[#C46B3B] shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            {flavour} ({count})
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Origin / Region */}
            {origins.length > 0 && (
              <div>
                <h2 className="text-[19px] font-normal text-[#181818] mb-3.5">Origin</h2>
                <ul className="space-y-2 text-[13px] text-[#555555]">
                  {origins.map(({ name: origin, count }) => {
                    const isActive = selectedOrigin === origin;
                    return (
                      <li key={origin}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrigin((prev) => (prev === origin ? 'All' : origin));
                            setCurrentPage(1);
                          }}
                          className={`inline-flex items-center gap-2.5 text-left transition-colors cursor-pointer tabular-nums ${
                            isActive
                              ? 'text-[#181818] font-medium'
                              : 'text-[#555555] hover:text-[#181818]'
                          }`}
                        >
                          <span
                            className="w-[4px] h-[4px] bg-[#C46B3B] shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            {origin} ({count})
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Popular Mini-Cards */}
            {popularProducts.length > 0 && (
              <div>
                <h2 className="text-[17px] font-bold text-[#111111] uppercase tracking-wide mb-4">
                  Popular
                </h2>
                <div className="space-y-3.5">
                  {popularProducts.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3.5 p-2 rounded-xs hover:bg-[#FAF8F5] transition-colors group border border-transparent hover:border-[#EDEDED]"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onSelectProduct ? onSelectProduct(item) : onAddToCart(item)
                        }
                        className="w-[62px] h-[62px] bg-white border border-[#EAE5DE] rounded-2xs overflow-hidden shrink-0 cursor-pointer flex items-center justify-center p-1.5"
                      >
                        <img
                          src={getCleanImage(item.image, item.category)}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() =>
                            onSelectProduct ? onSelectProduct(item) : onAddToCart(item)
                          }
                          className="text-left text-[13px] font-bold text-[#181818] group-hover:text-[#E52E2E] transition-colors line-clamp-2 block w-full cursor-pointer leading-snug"
                        >
                          {item.name}
                        </button>
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
                        <div className="text-[12.5px] tabular-nums flex items-baseline gap-2">
                          <span className="font-bold text-[#E52E2E] font-mono-data">
                            {formatPKR(item.price)}
                          </span>
                          {item.originalPrice && (
                            <span className="text-[#9CA3AF] line-through text-[11px] font-mono-data">
                              {formatPKR(item.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter by price */}
            <div>
              <h2 className="text-[19px] font-normal text-[#181818] mb-4">Filter by price</h2>
              <input
                type="range"
                min={1500}
                max={5500}
                step={100}
                value={sliderMaxPrice}
                onChange={(e) => setSliderMaxPrice(Number(e.target.value))}
                aria-label="Maximum price filter"
                className="w-full h-[3px] accent-[#C46B3B] cursor-pointer"
              />
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-[12px] text-[#555555] tabular-nums">
                  Price: Rs. 1,500 — {formatPKR(sliderMaxPrice)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedMaxPrice(sliderMaxPrice);
                    setCurrentPage(1);
                  }}
                  className="bg-[#0B0B0B] hover:bg-[#15472B] text-white text-[11px] font-semibold uppercase tracking-[0.08em] px-4 py-2 transition-colors cursor-pointer shrink-0"
                >
                  FILTER
                </button>
              </div>
            </div>
          </aside>

          {/* Right Product Grid Area */}
          <div className="lg:col-span-9">
            {/* Toolbar: Result count + Sorting dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4 text-[13px] text-[#666666] tabular-nums">
                <p>
                  {totalProducts === 0
                    ? 'Showing 0 results'
                    : `Showing ${startIdx + 1}–${Math.min(
                        startIdx + 9,
                        totalProducts
                      )} of ${totalProducts} results`}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="text-[12px] uppercase tracking-[0.06em] text-[#C46B3B] hover:underline cursor-pointer"
                  >
                    Reset all
                  </button>
                )}
              </div>

              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortOption);
                    setCurrentPage(1);
                  }}
                  aria-label="Sort products"
                  className="appearance-none border border-[#181818] bg-white pl-4 pr-9 py-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#181818] cursor-pointer focus:outline-none"
                >
                  <option value="default">DEFAULT SORTING</option>
                  <option value="popularity">SORT BY POPULARITY</option>
                  <option value="rating">SORT BY AVERAGE RATING</option>
                  <option value="price-asc">PRICE: LOW TO HIGH</option>
                  <option value="price-desc">PRICE: HIGH TO LOW</option>
                </select>
                <span
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#181818]"
                  aria-hidden="true"
                >
                  &#9662;
                </span>
              </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6 pb-3 border-b border-[#F0EDE8]">
                <span className="text-[11px] uppercase tracking-[0.08em] text-[#888888] mr-1">
                  Active:
                </span>
                {selectedCategory !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-[#EBF3EC] text-[#143320] text-[12px] font-medium">
                    Category: {selectedCategory}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('All');
                        setSelectedSubcategory('All');
                        setCurrentPage(1);
                      }}
                      className="hover:text-red-700 font-bold cursor-pointer ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedSubcategory !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-[#F4EFE6] text-[#8C6036] text-[12px] font-medium">
                    Subcategory: {selectedSubcategory}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubcategory('All');
                        setCurrentPage(1);
                      }}
                      className="hover:text-red-700 font-bold cursor-pointer ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedBrand !== 'All Brands' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-[#F5F5F5] text-[#333333] text-[12px] font-medium">
                    Brand: {selectedBrand}
                    <button
                      type="button"
                      onClick={() => {
                        onClearBrand?.();
                        setCurrentPage(1);
                      }}
                      className="hover:text-red-700 font-bold cursor-pointer ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-[11.5px] uppercase tracking-[0.06em] text-[#C46B3B] hover:underline cursor-pointer ml-2"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="mb-6 p-4 bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] flex items-center justify-between text-[13.5px]">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={loadProducts}
                  className="underline font-semibold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 lg:gap-6">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse flex flex-col">
                    <div className="aspect-[4/4.3] w-full bg-[#F3EFEA]" />
                    <div className="mt-3 space-y-1.5">
                      <div className="h-3.5 bg-[#EFEBE5] w-3/4 mx-auto" />
                      <div className="h-2.5 bg-[#EFEBE5] w-1/3 mx-auto" />
                      <div className="h-3.5 bg-[#EFEBE5] w-1/4 mx-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : productsList.length === 0 ? (
              <div className="py-16 text-center border border-[#EAEAEA] bg-[#FAF9F6]">
                <p className="text-[16px] font-bold text-[#111111] mb-1">
                  No products yet added
                </p>
                <p className="text-[13px] text-[#666666] mb-4">
                  No products match your selected filters or this category has no items yet.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-6 py-2.5 bg-[#0B0B0B] hover:bg-[#E52E2E] text-white text-[12px] uppercase tracking-[0.08em] transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsList.map((product) => {
                  const isBroken = brokenImages[product.id];
                  const isWishlisted = wishlistIds.includes(product.id);

                  // Compute discount percentage if originalPrice exists
                  const hasDiscount =
                    product.originalPrice && product.originalPrice > product.price;
                  const discountPercent = hasDiscount
                    ? Math.round(
                        ((product.originalPrice! - product.price) /
                          product.originalPrice!) *
                          100
                      )
                    : product.isSale
                    ? 20
                    : null;

                  return (
                    <article
                      key={product.id}
                      className="group bg-white border border-[#EDEDED] hover:border-[#15472B]/30 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden"
                    >
                      {/* Top Half: Studio Photo Area (Clean White Background with Transparent Product Cutout) */}
                      <div className="relative aspect-square w-full bg-white flex items-center justify-center p-5 overflow-hidden select-none">
                        {/* Top-Left Badges: Discount Pill + Optional Secondary Pill */}
                        <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1">
                          {discountPercent && (
                            <span className="border border-[#E52E2E] bg-white text-[#E52E2E] text-[10.5px] font-bold px-1.5 py-0.5 leading-none tracking-tight">
                              -{discountPercent}%
                            </span>
                          )}
                          {product.isOrganic && (
                            <span className="border border-[#0284C7] bg-white text-[#0284C7] text-[9.5px] font-semibold px-1.5 py-0.5 leading-none uppercase tracking-tight">
                              Pre_order
                            </span>
                          )}
                        </div>

                        {/* Top-Right Floating Action Buttons Column (Visible on Hover) */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-all duration-200 z-10 translate-x-2 group-hover:translate-x-0">
                          {/* 1. Quick Add to Cart Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product);
                            }}
                            aria-label={`Add ${product.name} to cart`}
                            title="Add to Cart"
                            className="w-8 h-8 rounded-full bg-white shadow-sm border border-[#E5E5E5] flex items-center justify-center text-[#4B5563] hover:text-white hover:bg-[#E52E2E] hover:border-[#E52E2E] transition-all cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 stroke-[2]" />
                          </button>

                          {/* 2. Wishlist Button */}
                          {onToggleWishlist && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleWishlist(product);
                              }}
                              aria-label={
                                isWishlisted
                                  ? `Remove ${product.name} from wishlist`
                                  : `Add ${product.name} to wishlist`
                              }
                              title="Wishlist"
                              className={`w-8 h-8 rounded-full bg-white shadow-sm border border-[#E5E5E5] flex items-center justify-center transition-all cursor-pointer ${
                                isWishlisted
                                  ? 'text-[#E52E2E] border-[#E52E2E]'
                                  : 'text-[#4B5563] hover:text-white hover:bg-[#E52E2E] hover:border-[#E52E2E]'
                              }`}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 stroke-[2] ${
                                  isWishlisted ? 'fill-[#E52E2E]' : ''
                                }`}
                              />
                            </button>
                          )}

                          {/* 3. Quick View Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectProduct) onSelectProduct(product);
                              else onAddToCart(product);
                            }}
                            aria-label={`Quick view ${product.name}`}
                            title="Quick View"
                            className="w-8 h-8 rounded-full bg-white shadow-sm border border-[#E5E5E5] flex items-center justify-center text-[#4B5563] hover:text-white hover:bg-[#E52E2E] hover:border-[#E52E2E] transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                        </div>

                        {/* Studio Product Image: Transparent Cutout on White */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectProduct) onSelectProduct(product);
                            else onAddToCart(product);
                          }}
                          className="w-full h-full flex items-center justify-center cursor-pointer p-2"
                        >
                          <img
                            src={getCleanImage(product.image, product.category)}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setBrokenImages((prev) => ({ ...prev, [product.id]: true }))
                            }
                            className="max-w-full max-h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
                          />
                        </button>
                      </div>

                      {/* Bottom Half: Text Meta (Left Aligned, Exact Match to Reference Image) */}
                      <div className="p-4 sm:p-5 pt-3 flex flex-col justify-between flex-1 border-t border-[#F5F5F5] bg-white">
                        <div>
                          {/* Dynamic Gold Stars Rating & Reviews Count */}
                          <div className="flex items-center gap-1.5 text-[#F59E0B]">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  viewBox="0 0 16 16"
                                  className={`w-3.5 h-3.5 ${
                                    star <= Math.round(product.rating || 5)
                                      ? 'fill-[#F59E0B] text-[#F59E0B]'
                                      : 'fill-[#E5E7EB] text-[#E5E7EB]'
                                  }`}
                                >
                                  <path d="M8 1.4L9.95 5.35L14.3 5.98L11.15 9.05L11.89 13.38L8 11.33L4.11 13.38L4.85 9.05L1.7 5.98L6.05 5.35L8 1.4Z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-[11.5px] font-medium text-[#6B7280]">
                              ({product.reviewsCount ?? 0})
                            </span>
                          </div>

                          {/* Product Title */}
                          <h3 className="mt-2 text-[13.5px] sm:text-[14px] font-bold text-[#111111] hover:text-[#E52E2E] transition-colors leading-snug line-clamp-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectProduct) onSelectProduct(product);
                                else onAddToCart(product);
                              }}
                              className="text-left cursor-pointer"
                            >
                              {product.name}
                            </button>
                          </h3>
                        </div>

                        {/* Price Row (Strikethrough Original + Bold Red Sale Price) */}
                        <div className="mt-1 flex items-baseline gap-2">
                          {hasDiscount ? (
                            <>
                              <span className="text-[12.5px] text-[#9CA3AF] line-through font-medium font-mono-data">
                                Rs. {product.originalPrice!.toLocaleString('en-PK')}
                              </span>
                              <span className="text-[14.5px] font-extrabold text-[#E52E2E] font-mono-data">
                                Rs. {product.price.toLocaleString('en-PK')}
                              </span>
                            </>
                          ) : (
                            <span className="text-[14.5px] font-extrabold text-[#E52E2E] font-mono-data">
                              Rs. {product.price.toLocaleString('en-PK')}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2 tabular-nums">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-9 h-9 text-[13px] border transition-colors cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#0B0B0B] text-white border-[#0B0B0B]'
                        : 'bg-white text-[#444444] border-[#E0E0E0] hover:border-[#181818]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
});
