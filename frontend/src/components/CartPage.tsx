import React, { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Product } from '../data/storeData';

export interface CartPageItem {
  product: Product;
  quantity: number;
}

interface CartPageProps {
  items: CartPageItem[];
  recommendedProducts: Product[];
  subtotal: number;
  shippingFee: number;
  orderTotal: number;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onProceedToCheckout: () => void;
  onNavigateHome: () => void;
  onNavigateShop: () => void;
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

export const CartPage: React.FC<CartPageProps> = ({
  items,
  recommendedProducts,
  subtotal,
  shippingFee,
  orderTotal,
  onUpdateQty,
  onRemoveItem,
  onAddToCart,
  onSelectProduct,
  onProceedToCheckout,
  onNavigateHome,
  onNavigateShop,
}) => {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

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
          <span className="text-[#444444]">Cart</span>
        </nav>

        {/* Page Title & Continue Shopping Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-8 border-b border-[#EAEAEA]">
          <div>
            <p className="text-[11.5px] uppercase tracking-[0.12em] text-[#C46B3B] font-semibold mb-1.5">
              Nationwide Cash on Delivery
            </p>
            <h1 className="text-[30px] sm:text-[36px] font-normal text-[#181818] leading-tight">
              Shopping Cart {totalCount > 0 ? `(${totalCount})` : ''}
            </h1>
          </div>

          <button
            type="button"
            onClick={onNavigateShop}
            className="self-start sm:self-auto border border-[#181818] bg-white hover:bg-[#181818] hover:text-white px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#181818] transition-colors cursor-pointer shrink-0"
          >
            CONTINUE SHOPPING
          </button>
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="border border-[#EAEAEA] bg-[#FAF9F6] py-16 px-6 text-center mb-14">
            <p className="text-[16px] text-[#444444] mb-5">Your shopping cart is currently empty.</p>
            <button
              type="button"
              onClick={onNavigateShop}
              className="inline-flex items-center justify-center bg-[#0B0B0B] hover:bg-[#15472B] text-white text-[11.5px] font-semibold uppercase tracking-[0.09em] px-8 py-3.5 transition-colors cursor-pointer"
            >
              RETURN TO SHOP
            </button>
          </div>
        ) : (
          /* Populated 2-Column Cart + Totals */
          <>
            <div className="bg-[#FAF3F0] px-5 py-3.5 mb-8 text-[13px] text-[#15472B]">
              {subtotal >= 1200
                ? 'Your order qualifies for Free Nationwide Delivery across Pakistan.'
                : `Add ${formatPKR(1200 - subtotal)} more for Free Nationwide Delivery across Pakistan.`}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              {/* Left Cart Items Table */}
              <div className="lg:col-span-8">
                {/* Desktop Column Headers */}
                <div className="hidden md:grid grid-cols-12 gap-4 pb-3 border-b border-[#EAEAEA] text-[11.5px] uppercase tracking-[0.08em] text-[#666666]">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                </div>

                <div className="divide-y divide-[#EAEAEA]">
                  {items.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:items-center"
                    >
                      {/* Product Image & Info */}
                      <div className="md:col-span-6 flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product)}
                          className="w-[74px] h-[88px] bg-[#FAF3F0] overflow-hidden shrink-0 cursor-pointer"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </button>
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.07em] text-[#C46B3B]">
                            {product.brand}
                          </p>
                          <h2 className="text-[16px] font-normal text-[#181818] leading-snug mt-0.5">
                            <button
                              type="button"
                              onClick={() => onSelectProduct(product)}
                              className="text-left hover:text-[#15472B] transition-colors cursor-pointer"
                            >
                              {product.name}
                            </button>
                          </h2>
                          <p className="text-[12.5px] text-[#777777] mt-0.5">{product.size}</p>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="md:col-span-2 flex md:block items-center justify-between text-[13.5px] text-[#555555] md:text-center tabular-nums">
                        <span className="md:hidden text-[12px] uppercase tracking-[0.06em] text-[#777777]">
                          Price
                        </span>
                        <span>{formatPKR(product.price)}</span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="md:col-span-2 flex md:justify-center items-center justify-between">
                        <span className="md:hidden text-[12px] uppercase tracking-[0.06em] text-[#777777]">
                          Quantity
                        </span>
                        <div className="inline-flex items-center border border-[#D4D4D4] bg-white">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, -1)}
                            aria-label={`Decrease quantity of ${product.name}`}
                            className="p-2 hover:bg-[#FAF3F0] text-[#181818] cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-[13px] tabular-nums text-[#181818]">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, 1)}
                            aria-label={`Increase quantity of ${product.name}`}
                            className="p-2 hover:bg-[#FAF3F0] text-[#181818] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Line Subtotal & Remove */}
                      <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3 tabular-nums">
                        <span className="text-[14.5px] font-medium text-[#181818]">
                          {formatPKR(product.price * quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(product.id)}
                          aria-label={`Remove ${product.name}`}
                          className="p-1.5 text-[#777777] hover:text-[#181818] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Cart Totals Summary */}
              <aside
                aria-label="Order summary"
                className="lg:col-span-4 bg-[#FAF3F0] p-7 sm:p-8 space-y-5"
              >
                <h2 className="text-[20px] font-normal text-[#181818] pb-3 border-b border-[#E6DDD2]">
                  Cart Totals
                </h2>

                <div className="space-y-3 text-[13.5px] tabular-nums">
                  <div className="flex items-center justify-between text-[#555555]">
                    <span>Subtotal</span>
                    <span className="text-[#181818]">{formatPKR(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#555555]">
                    <span>Shipping</span>
                    <span className="text-[#181818]">
                      {shippingFee === 0 ? 'Free' : formatPKR(shippingFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#E6DDD2] text-[16px] font-medium text-[#181818]">
                    <span>Estimated Total</span>
                    <span>{formatPKR(orderTotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onProceedToCheckout}
                  className="w-full py-3.5 bg-[#0B0B0B] hover:bg-[#15472B] text-white text-[11.5px] font-semibold uppercase tracking-[0.09em] transition-colors cursor-pointer"
                >
                  PROCEED TO CHECKOUT
                </button>
              </aside>
            </div>
          </>
        )}

        {/* Recommended Products Row */}
        {recommendedProducts.length > 0 && (
          <section
            aria-labelledby="cart-recommended-heading"
            className="mt-16 pt-12 border-t border-[#EAEAEA]"
          >
            <h2
              id="cart-recommended-heading"
              className="text-[24px] sm:text-[28px] font-normal text-[#181818] mb-7"
            >
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
              {recommendedProducts.slice(0, 4).map((product) => {
                const isBroken = brokenImages[product.id];
                return (
                  <article key={product.id} className="group flex flex-col">
                    <div className="relative aspect-[3/3.55] w-full bg-[#FAF3F0] overflow-hidden">
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
