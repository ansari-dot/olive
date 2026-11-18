import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Product } from '../data/storeData';

interface HeroShowcaseMosaicProps {
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

export const HeroShowcaseMosaic: React.FC<HeroShowcaseMosaicProps> = ({
  products,
  onAddToCart,
  onSelectProduct,
}) => {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  return (
    <section
      aria-label="Curated Olive Oil & Harvest Showcase"
      className="w-full bg-white py-10 sm:py-14 lg:py-16"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-7 lg:auto-rows-[320px] xl:auto-rows-[360px]">
          {products.map((product) => {
            const isWide = product.mosaicSpan === 'wide';
            const isBroken = brokenImages[product.id];

            return (
              <article
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className={`group relative bg-[#FAF3F0] overflow-hidden cursor-pointer ${
                  isWide
                    ? 'sm:col-span-2 aspect-[16/9] lg:aspect-auto lg:h-full'
                    : 'aspect-[3/3.6] lg:aspect-auto lg:h-full'
                }`}
              >
                {/* Top-Left Corner Badges */}
                {product.isSale ? (
                  <span className="absolute top-0 left-0 z-20 bg-[#C46B3B] text-white text-[12px] font-medium leading-none px-3.5 py-2">
                    Sale
                  </span>
                ) : product.isNew ? (
                  <span className="absolute top-0 left-0 z-20 bg-[#7E8F5B] text-white text-[12px] font-medium leading-none px-3.5 py-2">
                    New
                  </span>
                ) : null}

                {/* Studio Product Photo */}
                {!isBroken ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenImages((prev) => ({ ...prev, [product.id]: true }))
                    }
                    className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-6 text-center text-[#15472B]">
                    <span className="font-serif-brand text-lg">{product.name}</span>
                  </div>
                )}

                {/* Hover & Focus Overlay matching editorial design */}
                <div className="absolute inset-0 z-10 bg-[#FAF6F2]/92 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-center px-5">
                  <h3 className="text-[19px] sm:text-[21px] font-normal leading-snug text-[#181818] max-w-[18ch]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProduct(product);
                      }}
                      className="underline underline-offset-4 decoration-[1px] hover:text-[#15472B] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15472B]"
                    >
                      {product.name}
                    </button>
                  </h3>

                  <div className="mt-2.5">
                    <StarRating rating={product.rating ?? 5} />
                  </div>

                  <div className="mt-2.5 flex items-center justify-center gap-2 text-[15px] tabular-nums">
                    {product.originalPrice ? (
                      <>
                        <span className="text-[#888888] line-through">
                          {formatPKR(product.originalPrice)}
                        </span>
                        <span className="text-[#C46B3B] font-medium">
                          {formatPKR(product.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-[#2C2C2C]">{formatPKR(product.price)}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C46B3B] hover:text-[#15472B] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15472B]"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 stroke-[1.75]" />
                    <span>ADD TO CART</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
