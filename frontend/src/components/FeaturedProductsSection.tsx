import React, { useState, useMemo } from 'react';
import { ShoppingBag, Heart, Eye } from 'lucide-react';
import { Product } from '../data/storeData';
import { resolveImageUrl } from '../services/api';
import { useScrollReveal } from '../hooks/useScrollReveal';

export interface FeaturedProductsSectionProps {
  products: Product[];
  wishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
  sectionId?: string;
  title?: string;
  heading?: string;
  subtitle?: string;
  columns?: 3 | 4;
  cardBgClass?: string;
  sectionBgClass?: string;
  viewAllLabel?: string;
  onViewAll?: () => void;
}

const TABS = [
  { id: 'ALL', label: 'ALL' },
  { id: 'SPICES', label: 'SPICES & HERBS', match: ['Ground Spices', 'Whole Spices', 'Herbs and Botanicals', 'Seasonings and Spice Blends'] },
  { id: 'OILS', label: 'OILS & OLIVES', match: ['Olive Products', 'Edible and Specialty Oils', 'Herbal and Botanical Oils'] },
  { id: 'MUSHROOMS', label: 'MUSHROOMS & SHILAJIT', match: ['Mushrooms and Mushroom Products', 'Extracts and Concentrates'] },
  { id: 'TEA_HONEY', label: 'TEA & HONEY', match: ['Tea and Herbal Infusions', 'Natural Sweeteners', 'Coffee', 'Dried Fruits', 'Nuts'] },
];

/**
 * Returns the exact uploaded product image resolved cleanly, without injecting unwanted placeholder images
 */
export const getCleanImage = (imgUrl?: string, _category?: string) => {
  if (imgUrl && typeof imgUrl === 'string' && imgUrl.trim()) {
    return resolveImageUrl(imgUrl.trim());
  }
  return '';
};

export const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = React.memo(({
  products,
  wishlistIds = [],
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  sectionId = 'top-products',
  title,
  heading,
  subtitle,
  columns = 4,
  sectionBgClass = 'bg-white',
  viewAllLabel = 'VIEW ALL PRODUCTS',
  onViewAll,
}) => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const { ref: revealRef, isVisible } = useScrollReveal<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px',
  });

  // Filter products by selected department tab
  const filteredProducts = useMemo(() => {
    if (activeTab === 'ALL') return products.slice(0, 8);
    const selected = TABS.find((t) => t.id === activeTab);
    if (!selected || !selected.match) return products.slice(0, 8);
    const matched = products.filter((p) =>
      selected.match!.some(
        (m) =>
          p.category?.toLowerCase() === m.toLowerCase() ||
          p.department?.toLowerCase().includes(m.toLowerCase())
      )
    );
    return matched.slice(0, 8);
  }, [products, activeTab]);

  const mainTitle = (title || heading || 'TOP PRODUCTS').toUpperCase();

  return (
    <section
      id={sectionId}
      aria-label={mainTitle}
      className={`w-full ${sectionBgClass} py-14 sm:py-16 lg:py-20 overflow-hidden`}
    >
      <div ref={revealRef} className="max-w-[1400px] xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* =========================================================================
            SECTION HEADER + CATEGORY FILTER TABS (Exact Layout in reference image)
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#F0EDE8]">
          {/* Left: TOP PRODUCTS Title */}
          <div>
            <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-black uppercase tracking-tight text-[#111111] leading-none">
              {mainTitle}
            </h2>
            {subtitle && (
              <p className="mt-2 text-[13px] text-[#6E6A66] font-normal">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right: Category Tabs (ALL in Red box, others plain uppercase) */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-4 select-none">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#E52E2E] text-white px-3.5 py-1 text-[11px] sm:text-[11.5px] font-bold uppercase tracking-wider rounded-2xs shadow-xs'
                      : 'text-[#444444] hover:text-[#E52E2E] text-[11px] sm:text-[11.5px] font-bold uppercase tracking-wider px-1.5 py-1'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            4-COLUMN PRODUCT GRID MATCHING REFERENCE SCREENSHOT
            ========================================================================= */}
        {filteredProducts.length > 0 ? (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 lg:gap-7 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {filteredProducts.map((product, index) => {
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
                className="group bg-transparent border border-[#EDEDED] hover:border-[#15472B]/30 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Top Half: Studio Photo Area (Clean Transparent Product Card) */}
                <div className="relative aspect-square w-full bg-transparent flex items-center justify-center p-5 overflow-hidden select-none">
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
                            ? 'text-[#E52E2E] border-[#E52E2E] bg-[#FFF5F5]'
                            : 'text-[#4B5563] hover:text-white hover:bg-[#E52E2E] hover:border-[#E52E2E]'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 stroke-[2] ${
                            isWishlisted ? 'fill-current' : ''
                          }`}
                        />
                      </button>
                    )}

                    {/* 3. Quick View / Product Detail Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectProduct) onSelectProduct(product);
                        else onAddToCart(product);
                      }}
                      aria-label={`Quick view ${product.name}`}
                      title="Quick View"
                      className="w-8 h-8 rounded-full bg-white shadow-sm border border-[#E5E5E5] flex items-center justify-center text-[#4B5563] hover:text-white hover:bg-[#15472B] hover:border-[#15472B] transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 stroke-[2]" />
                    </button>
                  </div>

                  {/* Centered Product Photograph */}
                  {!isBroken ? (
                    <button
                      type="button"
                      onClick={() =>
                        onSelectProduct
                          ? onSelectProduct(product)
                          : onAddToCart(product)
                      }
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                    >
                      <img
                        src={getCleanImage(product.image, product.category)}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenImages((prev) => ({
                            ...prev,
                            [product.id]: true,
                          }))
                        }
                        className="w-full h-full object-contain p-2 drop-shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out group-hover:scale-105"
                      />
                    </button>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center text-[#15472B]">
                      <span className="font-serif-brand text-sm font-semibold">
                        {product.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Half: Details Area (Left-Aligned as in Screenshot) */}
                <div className="p-4 pt-3.5 bg-transparent flex flex-col justify-between flex-1 text-left">
                  <div>
                    {/* Star Rating & Review Count (Left-Aligned, Gold Stars) */}
                    <div
                      className="flex items-center gap-1.5 mb-1.5 text-[#FBBF24]"
                      aria-label={`Rated ${product.rating || 5} out of 5 stars`}
                    >
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg
                            key={s}
                            viewBox="0 0 16 16"
                            className={`w-3.5 h-3.5 ${
                              s <= Math.round(product.rating || 5)
                                ? 'text-[#FBBF24] fill-[#FBBF24]'
                                : 'text-[#D1D5DB] fill-[#D1D5DB]'
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

                    {/* Product Title (Bold, Left-Aligned, Line-Clamp 1) */}
                    <h3 className="text-[13.5px] sm:text-[14px] font-bold text-[#1F2937] group-hover:text-[#15472B] line-clamp-1 mb-1 leading-snug">
                      <button
                        type="button"
                        onClick={() =>
                          onSelectProduct
                            ? onSelectProduct(product)
                            : onAddToCart(product)
                        }
                        className="text-left hover:underline cursor-pointer"
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
      ) : (
        <div className="w-full py-16 text-center border border-dashed border-[#E5E7EB] bg-[#FAF8F5] rounded-xs my-4">
          <p className="text-[15px] font-bold text-[#1F2937]">No products yet added</p>
          <p className="text-[12.5px] text-[#6B7280] mt-1">
            {activeTab === 'ALL'
              ? 'There are no products currently added in this section.'
              : 'No products currently added for this department.'}
          </p>
        </div>
      )}

      {/* View All Button */}
      {filteredProducts.length > 0 && onViewAll && viewAllLabel && (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex items-center gap-2 border border-[#181818] bg-white hover:bg-[#181818] hover:text-white text-[#181818] text-[11.5px] font-bold uppercase tracking-[0.1em] px-8 py-3 transition-colors cursor-pointer shadow-xs"
            >
              <span>{viewAllLabel}</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
});
