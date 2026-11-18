import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Product } from '../data/storeData';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface FeaturedProductsSectionProps {
  products: Product[];
  wishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
  sectionId?: string;
  heading?: string;
  subtitle?: string;
  columns?: 3 | 4;
  cardBgClass?: string;
  sectionBgClass?: string;
  viewAllLabel?: string;
  onViewAll?: () => void;
}

const formatPKR = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

const StarRating: React.FC<{ rating?: number }> = ({ rating = 4 }) => {
  return (
    <div
      className="flex items-center justify-center gap-0.5"
      aria-label={`Rated ${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rating;
        return (
          <svg
            key={star}
            viewBox="0 0 16 16"
            className="w-[13px] h-[13px] text-[#C46B3B]"
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
};

export const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({
  products,
  wishlistIds = [],
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  sectionId = 'featured-products',
  heading,
  subtitle,
  columns = 3,
  cardBgClass = 'bg-[#FAF3F0]',
  sectionBgClass = 'bg-white',
  viewAllLabel,
  onViewAll,
}) => {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const { ref: revealRef, isVisible } = useScrollReveal<HTMLDivElement>({
    threshold: 0.14,
    rootMargin: '0px 0px -48px 0px',
  });

  const gridColsClass =
    columns === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7'
      : 'grid-cols-1 md:grid-cols-3 gap-7 lg:gap-8';

  return (
    <section
      id={sectionId}
      aria-label={heading ?? 'Featured Olive Oils'}
      className={`w-full ${sectionBgClass} py-16 sm:py-20 lg:py-24 overflow-hidden`}
    >
      <div ref={revealRef} className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        {heading && (
          <div
            className={`text-center max-w-[640px] mx-auto mb-12 lg:mb-14 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <h2 className="text-[32px] sm:text-[38px] lg:text-[42px] font-normal tracking-[-0.01em] text-[#111111] leading-tight">
              {heading}
            </h2>
            {subtitle && (
              <p className="mt-2.5 text-[14.5px] sm:text-[15px] text-[#6E6A66] font-normal leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className={`grid ${gridColsClass}`}>
          {products.map((product, index) => {
            const isBroken = brokenImages[product.id];
            return (
              <article
                key={product.id}
                style={{
                  transitionDelay: isVisible ? `${index * 110}ms` : '0ms',
                }}
                className={`group flex flex-col transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                {/* Warm Studio Card Frame */}
                <div
                  className={`relative aspect-[3/3.75] w-full ${cardBgClass} overflow-hidden`}
                >
                  {product.isSale && (
                    <span className="absolute top-0 left-0 z-10 bg-[#C46B3B] text-white text-[12px] font-medium leading-none px-3.5 py-2 tracking-[0.02em]">
                      Sale
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

                  {!isBroken ? (
                    <button
                      type="button"
                      onClick={() => (onSelectProduct ? onSelectProduct(product) : onAddToCart(product))}
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

                  {/* Subtle Quick-Add Action on Hover/Focus */}
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

                {/* Centered Title, Star Rating & Price */}
                <div className="mt-4 text-center">
                  <h3 className="text-[16.5px] sm:text-[17.5px] font-normal text-[#1E1E1E] leading-snug">
                    <button
                      type="button"
                      onClick={() => (onSelectProduct ? onSelectProduct(product) : onAddToCart(product))}
                      className="hover:text-[#15472B] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15472B]"
                    >
                      {product.name}
                    </button>
                  </h3>

                  <div className="mt-1.5">
                    <StarRating rating={product.rating} />
                  </div>

                  <div className="mt-1.5 flex items-center justify-center gap-2 text-[14px] tabular-nums">
                    {product.originalPrice ? (
                      <>
                        <span className="text-[#555555] line-through">
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

        {onViewAll && viewAllLabel && (
          <div className="mt-11 text-center">
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex items-center gap-2 border border-[#181818] bg-white hover:bg-[#181818] hover:text-white text-[#181818] text-[11.5px] font-semibold uppercase tracking-[0.09em] px-7 py-3 transition-colors cursor-pointer"
            >
              <span>{viewAllLabel}</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
