import React, { useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product } from '../data/storeData';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface UniqueProductsSectionProps {
  products: Product[];
  wishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onViewAll?: () => void;
}

const formatPKR = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

export const UniqueProductsSection: React.FC<UniqueProductsSectionProps> = React.memo(({
  products,
  wishlistIds = [],
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
}) => {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const { ref: revealRef, isVisible } = useScrollReveal<HTMLDivElement>({
    threshold: 0.14,
    rootMargin: '0px 0px -48px 0px',
  });

  return (
    <section
      id="unique-products"
      aria-labelledby="unique-products-heading"
      className="w-full bg-white py-16 sm:py-20 lg:py-24 overflow-hidden"
    >
      <div ref={revealRef} className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Centered Editorial Header */}
        <div
          className={`text-center max-w-[660px] mx-auto mb-12 lg:mb-14 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <p className="text-[11.5px] uppercase tracking-[0.16em] text-[#788B23] font-semibold mb-2">
            Small-Batch Orchard Editions
          </p>
          <h2
            id="unique-products-heading"
            className="text-[32px] sm:text-[38px] lg:text-[42px] font-normal tracking-[-0.01em] text-[#111111] leading-tight"
          >
            Unique &amp; Rare Creations
          </h2>
          <p className="mt-2.5 text-[14.5px] sm:text-[15px] text-[#6E6A66] font-normal leading-relaxed">
            Artisanal botanical infusions, raw Sidr honeycomb preserves, and cold-cured olive apothecary staples crafted in micro-lots.
          </p>
        </div>

        {/* 4-Column Curated Unique Products Grid */}
        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {products.map((product, index) => {
            const isBroken = brokenImages[product.id];

            return (
              <article
                key={product.id}
                style={{
                  transitionDelay: isVisible ? `${(index + 1) * 95}ms` : '0ms',
                }}
                className={`group flex flex-col transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                {/* Clean Studio Frame with Craft Tag */}
                <div className="relative aspect-[3/3.55] w-full bg-transparent overflow-hidden">
                  {product.tag && (
                    <span className="absolute top-0 left-0 z-10 bg-[#7E8F5B] text-white text-[11.5px] font-medium leading-none px-3.5 py-2 tracking-[0.03em]">
                      {product.tag}
                    </span>
                  )}

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

                  {/* Top-Left Deal Badge */}
                  {(product.isDeal || product.dealBadge || (product.originalPrice && product.originalPrice > product.price)) && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="border border-[#D03B3B] bg-white text-[#D03B3B] text-[11px] font-bold px-2 py-0.5 leading-none tracking-tight shadow-2xs">
                        {product.dealBadge || (product.discountPercent ? `-${product.discountPercent}%` : '-13%')}
                      </span>
                    </div>
                  )}

                  {!isBroken ? (
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="w-full h-full block cursor-pointer"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
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

                  {/* Quick Add Bar on Hover/Focus */}
                  <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200 z-10">
                    <button
                      type="button"
                      onClick={() => onAddToCart(product)}
                      className="w-full py-2.5 bg-[#1C1C1C]/92 hover:bg-[#15472B] text-white text-[11.5px] uppercase tracking-[0.09em] font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 stroke-[1.9]" />
                      <span>Add to Bag</span>
                    </button>
                  </div>
                </div>

                {/* Editorial Details Below Card */}
                <div className="mt-4 flex-1 flex flex-col justify-between text-center">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.11em] text-[#788B23] font-semibold">
                      {product.origin ?? product.brand}
                    </p>
                    <h3 className="mt-1 text-[17.5px] font-normal text-[#181818] leading-snug">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="hover:text-[#15472B] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15472B]"
                      >
                        {product.name}
                      </button>
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-[1.6] text-[#6E6A66] line-clamp-2 px-1">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#F2EFEA] flex items-center justify-center gap-3 tabular-nums">
                    {product.originalPrice && product.originalPrice > product.price ? (
                      <>
                        <span className="text-[12.5px] text-[#9CA3AF] line-through font-mono-data">
                          {formatPKR(product.originalPrice)}
                        </span>
                        <span className="text-[14.5px] font-semibold text-[#D03B3B] font-mono-data">
                          {formatPKR(product.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-[14.5px] font-semibold text-[#181818]">
                        {formatPKR(product.price)}
                      </span>
                    )}
                    <span className="text-[12px] text-[#777777]">· {product.size}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="w-full py-16 text-center border border-dashed border-[#D1D5DB] bg-[#FAF8F5] rounded-xs">
          <p className="text-[15px] font-bold text-[#1F2937]">No products yet added</p>
          <p className="text-[12.5px] text-[#6B7280] mt-1">Special small-batch editions and rare creations will be announced soon.</p>
        </div>
      )}
      </div>
    </section>
  );
});
