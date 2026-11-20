import React from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
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
  return (
    <main className="w-full bg-white text-[#333333] font-sans antialiased">
      {/* =========================================================================
          1. BREADCRUMBS ROW (Exact format: Home > Wishlist with divider border)
          ========================================================================= */}
      <div className="w-full border-b border-[#EEEEEE] bg-white">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center text-[12.5px] text-[#777777]">
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-[#15472B] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="mx-2 text-[#CCCCCC] select-none" aria-hidden="true">
            &gt;
          </span>
          <span className="text-[#15472B] font-semibold tracking-wide">
            Wishlist
          </span>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Title & Actions Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-8 sm:mb-10 border-b border-[#EEEEEE]">
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-extrabold uppercase tracking-tight text-[#1F1F1F]">
              Your Wishlist
            </h1>
            <p className="mt-1 text-[13px] text-[#777777]">
              {items.length === 0
                ? 'No saved items in your wishlist.'
                : `${items.length} ${items.length === 1 ? 'item' : 'items'} saved for later.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {items.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={onMoveAllToCart}
                  className="bg-[#15472B] hover:bg-[#0D2F1C] text-white px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Move All To Cart</span>
                </button>
                <button
                  type="button"
                  onClick={onClearWishlist}
                  className="border border-[#E0E0E0] hover:border-[#1F1F1F] text-[#666666] hover:text-[#1F1F1F] px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Clear All
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onNavigateShop}
              className="border border-[#15472B] text-[#15472B] hover:bg-[#15472B] hover:text-white px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] transition-all cursor-pointer whitespace-nowrap"
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="border border-[#EEEEEE] bg-[#FAF8F5] py-16 px-6 text-center my-8">
            <div className="w-14 h-14 mx-auto mb-4 bg-white border border-[#E5E5E5] rounded-full flex items-center justify-center text-[#15472B] shadow-sm">
              <Heart className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h2 className="text-[20px] sm:text-[22px] font-bold text-[#1F1F1F] mb-2">
              Your wishlist is currently empty
            </h2>
            <p className="text-[13.5px] text-[#666666] max-w-md mx-auto mb-6">
              Save your favorite cold-pressed oils, wild honeys, and organic spices to review or purchase anytime.
            </p>
            <button
              type="button"
              onClick={onNavigateShop}
              className="bg-[#15472B] hover:bg-[#0D2F1C] text-white text-[12px] font-bold uppercase tracking-[0.1em] px-8 py-3.5 shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
            >
              Explore Harvests
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Wishlist Grid (4-Column Shopify Style Grid) */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map((product) => (
              <div
                key={product.id}
                className="group bg-white border border-[#EEEEEE] p-4 flex flex-col justify-between hover:border-[#15472B] transition-all duration-200 relative"
              >
                {/* Remove button (Top Right) */}
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product)}
                  className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-[#FDF2F2] text-[#999999] hover:text-[#C46B3B] border border-[#EEEEEE] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Product Image */}
                <div
                  onClick={() => onSelectProduct(product)}
                  className="aspect-square w-full bg-[#FAF8F5] overflow-hidden cursor-pointer"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Details */}
                <div className="mt-3.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-[#C46B3B] font-bold">
                    {product.brand}
                  </span>
                  <h2
                    onClick={() => onSelectProduct(product)}
                    className="text-[13.5px] font-bold text-[#1F1F1F] group-hover:text-[#15472B] transition-colors line-clamp-1 cursor-pointer mt-0.5 leading-snug"
                  >
                    {product.name}
                  </h2>
                  <p className="text-[11px] text-[#777777] mt-0.5">{product.size}</p>
                  <p className="text-[14px] font-bold text-[#15472B] mt-1.5 tabular-nums">
                    {formatPKR(product.price)}
                  </p>
                </div>

                {/* Add to Bag Button */}
                <button
                  type="button"
                  onClick={() => onAddToCart(product)}
                  className="mt-3.5 w-full bg-[#15472B] hover:bg-[#0D2F1C] text-white text-[11px] font-bold uppercase tracking-[0.1em] py-2.5 transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add To Bag</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Recommended Products */}
        {recommendedProducts && recommendedProducts.length > 0 && items.length > 0 && (
          <section className="mt-16 sm:mt-20 pt-12 border-t border-[#EEEEEE]">
            <h2 className="text-[20px] sm:text-[24px] font-bold text-[#1F1F1F] mb-6">
              Recommended For You
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {recommendedProducts.slice(0, 4).map((rec) => (
                <div
                  key={rec.id}
                  className="group bg-white border border-[#EEEEEE] p-4 flex flex-col justify-between hover:border-[#15472B] transition-colors"
                >
                  <div
                    onClick={() => onSelectProduct(rec)}
                    className="aspect-square w-full bg-[#FAF8F5] overflow-hidden cursor-pointer"
                  >
                    <img
                      src={rec.image}
                      alt={rec.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] uppercase tracking-wider text-[#C46B3B] font-bold">
                      {rec.brand}
                    </span>
                    <h3
                      onClick={() => onSelectProduct(rec)}
                      className="text-[13px] font-bold text-[#1F1F1F] hover:text-[#15472B] transition-colors line-clamp-1 cursor-pointer mt-0.5"
                    >
                      {rec.name}
                    </h3>
                    <p className="text-[13px] font-semibold text-[#15472B] mt-1 tabular-nums">
                      {formatPKR(rec.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddToCart(rec)}
                    className="mt-3 w-full border border-[#15472B] text-[#15472B] hover:bg-[#15472B] hover:text-white text-[11px] font-bold uppercase tracking-wider py-2 transition-colors cursor-pointer"
                  >
                    Add To Cart
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};
