import React, { useState } from 'react';
import { Product } from '../data/storeData';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface FeaturedCarouselSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

const formatPKR = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

const StarRating: React.FC<{ rating?: number }> = ({ rating = 5 }) => (
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

export const FeaturedCarouselSection: React.FC<FeaturedCarouselSectionProps> = ({
  products,
  onAddToCart,
  onSelectProduct,
}) => {
  const [startIndex, setStartIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const { ref: revealRef, isVisible } = useScrollReveal<HTMLDivElement>({
    threshold: 0.14,
    rootMargin: '0px 0px -48px 0px',
  });

  const visibleCount = Math.min(4, products.length);
  const visibleProducts: Product[] = [];
  for (let i = 0; i < visibleCount; i += 1) {
    visibleProducts.push(products[(startIndex + i) % products.length]);
  }

  const handlePrev = () => {
    setHasInteracted(true);
    setStartIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleNext = () => {
    setHasInteracted(true);
    setStartIndex((prev) => (prev + 1) % products.length);
  };

  return (
    <section
      id="featured-grid"
      aria-labelledby="featured-carousel-heading"
      className="w-full bg-[#FAF4ED] py-16 sm:py-20 lg:py-24 overflow-hidden"
    >
      <div ref={revealRef} className="max-w-[1340px] mx-auto px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[255px_1fr] gap-10 lg:gap-12 items-start">
          {/* Left Editorial Intro & Arrow Controls */}
          <div
            className={`pt-2 lg:pt-6 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <p className="text-[15px] font-normal text-[#C46B3B] leading-none mb-2.5">
              New
            </p>
            <h2
              id="featured-carousel-heading"
              className="text-[36px] sm:text-[42px] font-normal text-[#111111] leading-[1.08] tracking-[-0.015em]"
            >
              Featured
              <br />
              Products
            </h2>
            <p className="mt-5 text-[13.5px] leading-[1.72] text-[#6E6A66] max-w-[26ch]">
              Freshly cold-pressed harvests from Pakistan’s sunlit olive groves, bottled unfiltered for everyday kitchens.
            </p>

            {/* Thin Minimalist Left/Right Arrows */}
            <div className="mt-7 flex items-center gap-4">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous featured products"
                className="p-1 text-[#1C1C1C] hover:text-[#C46B3B] transition-colors cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 16"
                  className="w-5 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  aria-hidden="true"
                >
                  <path d="M22 8H2M8 2L2 8L8 14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next featured products"
                className="p-1 text-[#1C1C1C] hover:text-[#C46B3B] transition-colors cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 16"
                  className="w-5 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  aria-hidden="true"
                >
                  <path d="M2 8H22M16 2L22 8L16 14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right 4-Column Lifestyle Product Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {visibleProducts.map((product, index) => {
              const isBroken = brokenImages[product.id];
              return (
                <article
                  key={hasInteracted ? `${startIndex}-${product.id}` : product.id}
                  style={{
                    transitionDelay: isVisible && !hasInteracted ? `${(index + 1) * 95}ms` : '0ms',
                    animationDelay: hasInteracted ? `${index * 60}ms` : undefined,
                  }}
                  className={`group flex flex-col transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  } ${hasInteracted ? 'animate-featured-swap' : ''}`}
                >
                  <div className="relative aspect-[3/4.2] w-full bg-[#EFE8DF] overflow-hidden">
                    {product.isSale && (
                      <span className="absolute top-0 left-0 z-10 bg-[#C46B3B] text-white text-[12px] font-medium leading-none px-3.5 py-2 tracking-[0.02em]">
                        Sale
                      </span>
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

                    {/* Subtle Quick-Add Bar on Hover/Focus */}
                    <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200 z-10">
                      <button
                        type="button"
                        onClick={() => onAddToCart(product)}
                        className="w-full py-2.5 bg-[#1C1C1C]/90 hover:bg-[#15472B] text-white text-[11px] uppercase tracking-[0.09em] font-medium transition-colors cursor-pointer"
                      >
                        Add to Bag
                      </button>
                    </div>
                  </div>

                  {/* Centered Product Name, Terracotta Stars & PKR Price */}
                  <div className="mt-4 text-center">
                    <h3 className="text-[16.5px] sm:text-[17px] font-normal text-[#1E1E1E] leading-snug">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="hover:text-[#15472B] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15472B]"
                      >
                        {product.name}
                      </button>
                    </h3>

                    <div className="mt-1.5">
                      <StarRating rating={product.rating ?? 5} />
                    </div>

                    <div className="mt-1.5 flex items-center justify-center gap-2 text-[14px] tabular-nums">
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
        </div>
      </div>
    </section>
  );
};
