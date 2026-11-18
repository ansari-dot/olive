import React, { useState } from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Product } from '../data/storeData';

interface WishlistPageProps {
  items: Product[];
  recommendedProducts: Product[];
  onToggleWishlist: (product: Product) => void;
  onClearWishlist: () => void;
  onMoveAllToCart: () => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateHome: () => void;
  onNavigateShop: () => void;
}

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

export const WishlistPage: React.FC<WishlistPageProps> = ({
  items,
  recommendedProducts,
  onToggleWishlist,
  onClearWishlist,
  onMoveAllToCart,
  onAddToCart,
  onSelectProduct,
  onNavigateHome,
  onNavigateShop,
}) => {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  return (
    <main className="w-full bg-white py-10 sm:py-12 lg:py-14">
      <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Top Breadcrumb: Home / Wishlist */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 text-[12.5px] text-[#777777] flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-[#181818] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span aria-hidden="true">/</span>
          <span className="text-[#444444]">Wishlist</span>
        </nav>

        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-10 border-b border-[#EAEAEA]">
          <div>
            <p className="text-[11.5px] uppercase tracking-[0.12em] text-[#C46B3B] font-semibold mb-1.5">
              Saved Harvests
            </p>
            <h1 className="text-[30px] sm:text-[36px] font-normal text-[#181818] leading-tight">
              Your Wishlist
            </h1>
            <p className="mt-1.5 text-[13.5px] text-[#666666] tabular-nums">
              {items.length === 0
                ? 'No saved products yet'
                : `${items.length} ${items.length === 1 ? 'item' : 'items'} saved for later`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {items.length > 0 && (
              <button
                type="button"
                onClick={onMoveAllToCart}
                className="bg-[#0B0B0B] hover:bg-[#15472B] text-white px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>MOVE ALL TO BAG</span>
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateShop}
              className="border border-[#181818] bg-white hover:bg-[#181818] hover:text-white px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#181818] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              CONTINUE SHOPPING
            </button>
          </div>
        </div>

        {/* Empty State or Saved Grid */}
        {items.length === 0 ? (
          <div className="border border-[#EAEAEA] bg-[#FAF9F6] py-16 px-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-[#FAF3F0] text-[#C46B3B] flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h2 className="text-[22px] font-normal text-[#181818] mb-2">
              Your wishlist is currently empty
            </h2>
            <p className="text-[14.5px] text-[#555555] max-w-[48ch] mx-auto mb-6 leading-relaxed">
              Tap the heart icon on any cold-pressed olive oil, table olive jar, or wild Sidr honey to keep a curated list of your orchard favourites.
            </p>
            <button
              type="button"
              onClick={onNavigateShop}
              className="inline-flex items-center justify-center bg-[#0B0B0B] hover:bg-[#15472B] text-white text-[11.5px] font-semibold uppercase tracking-[0.09em] px-8 py-3.5 transition-colors cursor-pointer"
            >
              EXPLORE THE SHOP
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
              {items.map((product) => {
                const isBroken = brokenImages[product.id];
                return (
                  <article key={product.id} className="group flex flex-col">
                    <div className="relative aspect-[3/3.55] w-full bg-[#FAF3F0] overflow-hidden">
                      {product.isSale ? (
                        <span className="absolute top-0 left-0 z-10 bg-[#C46B3B] text-white text-[11.5px] font-medium leading-none px-3 py-1.5">
                          Sale
                        </span>
                      ) : product.isNew ? (
                        <span className="absolute top-0 left-0 z-10 bg-[#7E8F5B] text-white text-[11.5px] font-medium leading-none px-3 py-1.5">
                          New
                        </span>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => onToggleWishlist(product)}
                        aria-label={`Remove ${product.name} from wishlist`}
                        title="Remove from wishlist"
                        className="absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-white/95 hover:bg-white text-[#C46B3B] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>

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
                    </div>

                    <div className="mt-4 flex-1 flex flex-col justify-between text-center">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.09em] text-[#777777]">
                          {product.brand} · {product.size}
                        </p>
                        <h2 className="mt-1 text-[16.5px] font-normal text-[#1E1E1E] leading-snug">
                          <button
                            type="button"
                            onClick={() => onSelectProduct(product)}
                            className="hover:text-[#15472B] transition-colors cursor-pointer"
                          >
                            {product.name}
                          </button>
                        </h2>

                        <div className="mt-1.5">
                          <StarRating rating={product.rating} />
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

                      <div className="mt-4 space-y-2">
                        <button
                          type="button"
                          onClick={() => onAddToCart(product)}
                          className="w-full py-2.5 bg-[#0B0B0B] hover:bg-[#15472B] text-white text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer"
                        >
                          ADD TO BAG
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleWishlist(product)}
                          className="inline-flex items-center justify-center gap-1.5 text-[12px] text-[#777777] hover:text-[#181818] transition-colors cursor-pointer py-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="pt-6 border-t border-[#EAEAEA] flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={onClearWishlist}
                className="text-[12px] uppercase tracking-[0.08em] text-[#777777] hover:text-[#181818] transition-colors cursor-pointer"
              >
                Clear Wishlist
              </button>
              <p className="text-[13px] text-[#666666]">
                Free Nationwide Delivery across Pakistan on orders over Rs. 1,200.
              </p>
            </div>
          </div>
        )}

        {/* Recommended Products */}
        {recommendedProducts.length > 0 && (
          <section aria-labelledby="wishlist-recommended-heading" className="mt-16 pt-12 border-t border-[#EAEAEA]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
              <div>
                <p className="text-[11.5px] uppercase tracking-[0.12em] text-[#C46B3B] font-semibold">
                  Orchard Favourites
                </p>
                <h2
                  id="wishlist-recommended-heading"
                  className="mt-1 text-[24px] sm:text-[28px] font-normal text-[#181818]"
                >
                  Discover From This Harvest
                </h2>
              </div>
              <button
                type="button"
                onClick={onNavigateShop}
                className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#181818] hover:text-[#C46B3B] transition-colors cursor-pointer self-start sm:self-auto"
              >
                View All Products &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
              {recommendedProducts.slice(0, 4).map((product) => {
                const isWishlisted = items.some((item) => item.id === product.id);
                return (
                  <article key={product.id} className="group flex flex-col">
                    <div className="relative aspect-[3/3.55] w-full bg-[#FAF3F0] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => onToggleWishlist(product)}
                        aria-label={
                          isWishlisted
                            ? `Remove ${product.name} from wishlist`
                            : `Save ${product.name} to wishlist`
                        }
                        className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-white/95 hover:bg-white flex items-center justify-center shadow-xs transition-colors cursor-pointer ${
                          isWishlisted ? 'text-[#C46B3B]' : 'text-[#444444] hover:text-[#C46B3B]'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="w-full h-full block cursor-pointer"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                        />
                      </button>

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
                      <h3 className="text-[16px] font-normal text-[#1E1E1E] leading-snug">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product)}
                          className="hover:text-[#15472B] transition-colors cursor-pointer"
                        >
                          {product.name}
                        </button>
                      </h3>
                      <div className="mt-1.5">
                        <StarRating rating={product.rating} />
                      </div>
                      <p className="mt-1.5 text-[13.5px] text-[#555555] tabular-nums">
                        {formatPKR(product.price)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};
