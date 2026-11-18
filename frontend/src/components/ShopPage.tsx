import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { Product } from '../data/storeData';
import {
  fetchProducts,
  fetchProductFilters,
  ProductFiltersResponse,
} from '../services/api';

interface ShopPageProps {
  products?: Product[];
  wishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
  selectedBrand?: string;
  initialCategory?: string;
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

export const ShopPage: React.FC<ShopPageProps> = ({
  wishlistIds = [],
  onToggleWishlist,
  selectedBrand = 'All Brands',
  initialCategory = 'All',
  onClearBrand,
  onAddToCart,
  onSelectProduct,
  onNavigateHome,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
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
    setCurrentPage(1);
  }, [initialCategory]);

  // Fetch products whenever filters, sort or page change
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
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
    selectedFlavour !== 'All' ||
    selectedOrigin !== 'All' ||
    appliedMaxPrice < 5500;

  const resetAllFilters = () => {
    onClearBrand?.();
    setSelectedCategory('All');
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
        <nav aria-label="Breadcrumb" className="mb-8 text-[12.5px] text-[#777777]">
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-[#181818] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="mx-1.5" aria-hidden="true">
            /
          </span>
          <span className="text-[#444444]">Shop</span>
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
              <h2 className="text-[19px] font-normal text-[#181818] mb-3.5">Categories</h2>
              <ul className="space-y-2 text-[13px] text-[#555555]">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <li key={cat}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setCurrentPage(1);
                        }}
                        className={`inline-flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                          isActive
                            ? 'text-[#181818] font-medium'
                            : 'text-[#555555] hover:text-[#181818]'
                        }`}
                      >
                        <span
                          className="w-[4px] h-[4px] bg-[#C46B3B] shrink-0"
                          aria-hidden="true"
                        />
                        <span>{cat === 'All' ? 'All Categories' : cat}</span>
                      </button>
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
                <h2 className="text-[19px] font-normal text-[#181818] mb-4">Popular</h2>
                <div className="space-y-4">
                  {popularProducts.map((item) => (
                    <div key={item.id} className="flex items-center gap-3.5">
                      <button
                        type="button"
                        onClick={() =>
                          onSelectProduct ? onSelectProduct(item) : onAddToCart(item)
                        }
                        className="w-[56px] h-[64px] bg-[#FAF3F0] overflow-hidden shrink-0 cursor-pointer"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            onSelectProduct ? onSelectProduct(item) : onAddToCart(item)
                          }
                          className="text-left text-[13.5px] font-normal text-[#181818] hover:text-[#C46B3B] transition-colors truncate block w-full cursor-pointer"
                        >
                          {item.name}
                        </button>
                        <div className="my-1">
                          <StarRatingLeft rating={item.rating} />
                        </div>
                        <div className="text-[12.5px] tabular-nums flex items-center gap-1.5">
                          {item.originalPrice ? (
                            <>
                              <span className="text-[#777777] line-through">
                                {formatPKR(item.originalPrice)}
                              </span>
                              <span className="text-[#C46B3B]">{formatPKR(item.price)}</span>
                            </>
                          ) : (
                            <span className="text-[#555555]">{formatPKR(item.price)}</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
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
                    Reset
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7 lg:gap-8">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse flex flex-col">
                    <div className="aspect-[3/3.55] w-full bg-[#F3EFEA]" />
                    <div className="mt-4 space-y-2">
                      <div className="h-4 bg-[#EFEBE5] w-3/4 mx-auto" />
                      <div className="h-3 bg-[#EFEBE5] w-1/3 mx-auto" />
                      <div className="h-4 bg-[#EFEBE5] w-1/4 mx-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : productsList.length === 0 ? (
              <div className="py-16 text-center border border-[#EAEAEA] bg-[#FAF9F6]">
                <p className="text-[15px] text-[#444444] mb-4">
                  No products match your selected filters.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-6 py-2.5 bg-[#0B0B0B] text-white text-[12px] uppercase tracking-[0.08em] cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7 lg:gap-8">
                {productsList.map((product) => {
                  const isBroken = brokenImages[product.id];
                  return (
                    <article key={product.id} className="group flex flex-col">
                      <div className="relative aspect-[3/3.55] w-full bg-[#FAF3F0] overflow-hidden">
                        {/* Corner Tag: New (olive) or Sale (terracotta) */}
                        {product.isSale ? (
                          <span className="absolute top-0 left-0 z-10 bg-[#C46B3B] text-white text-[11.5px] font-medium leading-none px-3 py-1.5">
                            Sale
                          </span>
                        ) : product.isNew ? (
                          <span className="absolute top-0 left-0 z-10 bg-[#7E8F5B] text-white text-[11.5px] font-medium leading-none px-3 py-1.5">
                            New
                          </span>
                        ) : null}

                        {onToggleWishlist && (
                          <button
                            type="button"
                            onClick={() => onToggleWishlist(product)}
                            aria-label={
                              wishlistIds.includes(product.id)
                                ? `Remove ${product.name} from wishlist`
                                : `Save ${product.name} to wishlist`
                            }
                            className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-white/90 hover:bg-white flex items-center justify-center transition-all cursor-pointer ${
                              wishlistIds.includes(product.id)
                                ? 'text-[#C46B3B] opacity-100'
                                : 'text-[#444444] hover:text-[#C46B3B] opacity-85 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                wishlistIds.includes(product.id) ? 'fill-current' : ''
                              }`}
                            />
                          </button>
                        )}

                        {!isBroken ? (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectProduct ? onSelectProduct(product) : onAddToCart(product)
                            }
                            className="w-full h-full block cursor-pointer"
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setBrokenImages((prev) => ({ ...prev, [product.id]: true }))
                              }
                              className="w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                            />
                          </button>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-6 text-center text-[#15472B]">
                            <span className="font-serif-brand text-lg">{product.name}</span>
                          </div>
                        )}

                        {/* Hover / Focus Add to Bag */}
                        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200 z-10">
                          <button
                            type="button"
                            onClick={() => onAddToCart(product)}
                            className="w-full py-2.5 bg-[#1C1C1C]/90 hover:bg-[#15472B] text-white text-[11.5px] uppercase tracking-[0.09em] font-medium transition-colors cursor-pointer"
                          >
                            Add to Bag
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 text-center">
                        <h3 className="text-[16.5px] font-normal text-[#1E1E1E] leading-snug">
                          <button
                            type="button"
                            onClick={() =>
                              onSelectProduct ? onSelectProduct(product) : onAddToCart(product)
                            }
                            className="hover:text-[#15472B] transition-colors cursor-pointer"
                          >
                            {product.name}
                          </button>
                        </h3>

                        <div className="mt-1.5">
                          <StarRating rating={product.rating} />
                        </div>

                        <div className="mt-1.5 flex items-center justify-center gap-2 text-[13.5px] tabular-nums">
                          {product.originalPrice ? (
                            <>
                              <span className="text-[#777777] line-through">
                                {formatPKR(product.originalPrice)}
                              </span>
                              <span className="text-[#C46B3B]">
                                {formatPKR(product.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-[#555555]">{formatPKR(product.price)}</span>
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
};
