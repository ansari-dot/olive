import React, { useState } from 'react';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';
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
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const freeShippingThreshold = 3500;
  const progressPercent = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;
    if (clean === 'VEDA20' || clean === 'ORGANIC10') {
      setCouponApplied(true);
      setCouponError(null);
    } else {
      setCouponError('Invalid coupon code. Try VEDA20 for 20% off.');
    }
  };

  const discountAmount = couponApplied ? Math.round(subtotal * 0.2) : 0;
  const finalTotal = Math.max(0, orderTotal - discountAmount);

  return (
    <main className="w-full bg-white text-[#333333] font-sans antialiased">
      {/* =========================================================================
          1. BREADCRUMBS ROW (Exact Format: Home > Shopping Cart with divider)
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
            Shopping Cart
          </span>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Title & Continue Shopping Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-8 border-b border-[#EEEEEE]">
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-extrabold uppercase tracking-tight text-[#1F1F1F]">
              Your Shopping Cart
            </h1>
            <p className="mt-1 text-[13px] text-[#777777]">
              {totalCount === 0
                ? 'Your cart is currently empty.'
                : `You have ${totalCount} ${totalCount === 1 ? 'item' : 'items'} in your cart.`}
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateShop}
            className="self-start sm:self-auto border border-[#15472B] text-[#15472B] hover:bg-[#15472B] hover:text-white px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] transition-all cursor-pointer shrink-0"
          >
            Continue Shopping
          </button>
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="border border-[#EEEEEE] bg-[#FAF8F5] py-16 px-6 text-center my-8">
            <div className="w-14 h-14 mx-auto mb-4 bg-white border border-[#E5E5E5] rounded-full flex items-center justify-center text-[#15472B] shadow-sm">
              <ShoppingBag className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h2 className="text-[20px] sm:text-[22px] font-bold text-[#1F1F1F] mb-2">
              Your cart is empty
            </h2>
            <p className="text-[13.5px] text-[#666666] max-w-md mx-auto mb-6">
              Explore our single-origin olive oils, raw mountain honeys, Shilajit resins, and botanical spices.
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
          /* Populated 2-Column Cart Layout */
          <div>
            {/* Free Shipping Progress Notification */}
            <div className="bg-[#FAF8F5] border border-[#EBE7DF] p-4 sm:p-5 mb-8">
              <div className="flex items-center justify-between text-xs sm:text-[13px] font-medium text-[#222222] mb-2">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#15472B]" />
                  {subtotal >= freeShippingThreshold ? (
                    <strong className="text-[#15472B]">
                      Congratulations! You have unlocked Free Nationwide Shipping!
                    </strong>
                  ) : (
                    <span>
                      Add{' '}
                      <strong className="text-[#15472B]">
                        {formatPKR(freeShippingThreshold - subtotal)}
                      </strong>{' '}
                      more to unlock <strong>Free Nationwide Delivery</strong>!
                    </span>
                  )}
                </span>
                <span className="font-bold text-[#15472B]">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-[#E2DED6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#15472B] transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* =================================================================
                  LEFT COLUMN (col-span-8): Cart Items Table
                  ================================================================= */}
              <div className="lg:col-span-8">
                {/* Desktop Table Headers */}
                <div className="hidden sm:grid grid-cols-12 gap-4 pb-3 border-b border-[#EEEEEE] text-[11px] font-bold uppercase tracking-[0.1em] text-[#777777]">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-[#EEEEEE]">
                  {items.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center"
                    >
                      {/* Product Thumbnail & Title */}
                      <div className="sm:col-span-6 flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product)}
                          className="w-18 h-22 sm:w-20 sm:h-24 bg-[#F7F7F7] border border-[#EEEEEE] overflow-hidden shrink-0 cursor-pointer"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </button>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#C46B3B]">
                            {product.brand}
                          </span>
                          <h2 className="text-[14.5px] sm:text-[15px] font-bold text-[#1F1F1F] leading-snug mt-0.5">
                            <button
                              type="button"
                              onClick={() => onSelectProduct(product)}
                              className="text-left hover:text-[#15472B] transition-colors cursor-pointer"
                            >
                              {product.name}
                            </button>
                          </h2>
                          <p className="text-[11.5px] text-[#777777] mt-0.5">{product.size}</p>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="sm:col-span-2 flex sm:block items-center justify-between text-xs sm:text-[13px] text-[#444444] sm:text-center tabular-nums">
                        <span className="sm:hidden text-[11px] font-bold uppercase text-[#777777]">
                          Price:
                        </span>
                        <span>{formatPKR(product.price)}</span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="sm:col-span-2 flex sm:justify-center items-center justify-between">
                        <span className="sm:hidden text-[11px] font-bold uppercase text-[#777777]">
                          Quantity:
                        </span>
                        <div className="inline-flex items-center border border-[#E0E0E0] bg-white">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, -1)}
                            aria-label={`Decrease quantity of ${product.name}`}
                            className="p-1.5 sm:p-2 hover:bg-[#F5F5F5] text-[#333333] transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs sm:text-[13px] font-semibold tabular-nums text-[#1F1F1F]">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, 1)}
                            aria-label={`Increase quantity of ${product.name}`}
                            className="p-1.5 sm:p-2 hover:bg-[#F5F5F5] text-[#333333] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Line Total & Remove Button */}
                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-3 tabular-nums">
                        <span className="text-[14px] sm:text-[15px] font-bold text-[#1F1F1F]">
                          {formatPKR(product.price * quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(product.id)}
                          aria-label={`Remove ${product.name}`}
                          className="p-1.5 text-[#999999] hover:text-[#C46B3B] transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4 stroke-[1.8]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* =================================================================
                  RIGHT COLUMN (col-span-4): Order Summary Card
                  ================================================================= */}
              <div className="lg:col-span-4">
                <div className="bg-[#FAF8F5] border border-[#EBE7DF] p-6 sm:p-7 space-y-5">
                  <h2 className="text-[14px] font-extrabold uppercase tracking-wider text-[#1F1F1F] pb-3 border-b border-[#E2DED6]">
                    Order Summary
                  </h2>

                  {/* Summary Rows */}
                  <div className="space-y-3 text-[13px] text-[#555555]">
                    <div className="flex items-center justify-between">
                      <span>Subtotal ({totalCount} items)</span>
                      <span className="font-semibold text-[#1F1F1F] tabular-nums">
                        {formatPKR(subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Nationwide Delivery</span>
                      <span className="font-semibold text-[#1F1F1F] tabular-nums">
                        {subtotal >= freeShippingThreshold ? (
                          <span className="text-[#15472B] font-bold">FREE</span>
                        ) : (
                          formatPKR(shippingFee)
                        )}
                      </span>
                    </div>

                    {couponApplied && (
                      <div className="flex items-center justify-between text-[#15472B]">
                        <span>Coupon Discount (20%)</span>
                        <span className="font-bold tabular-nums">
                          -{formatPKR(discountAmount)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Coupon Form */}
                  <div className="pt-3 border-t border-[#E2DED6]">
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Coupon code (e.g. VEDA20)"
                        className="w-full bg-white border border-[#D5D0C5] px-3 py-2 text-[12px] text-[#222222] uppercase tracking-wider focus:outline-none focus:border-[#15472B]"
                      />
                      <button
                        type="submit"
                        className="bg-[#1F1F1F] hover:bg-[#15472B] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 transition-colors cursor-pointer shrink-0"
                      >
                        Apply
                      </button>
                    </form>
                    {couponApplied && (
                      <p className="text-[11px] text-[#15472B] font-semibold mt-1.5">
                        Coupon applied: 20% discount activated!
                      </p>
                    )}
                    {couponError && (
                      <p className="text-[11px] text-[#C46B3B] mt-1.5">{couponError}</p>
                    )}
                  </div>

                  {/* Total */}
                  <div className="pt-3 border-t border-[#E2DED6] flex items-center justify-between">
                    <span className="text-[14px] font-bold uppercase tracking-wider text-[#1F1F1F]">
                      Total
                    </span>
                    <span className="text-[18px] sm:text-[20px] font-black text-[#15472B] tabular-nums">
                      {formatPKR(finalTotal)}
                    </span>
                  </div>

                  {/* Checkout Button */}
                  <button
                    type="button"
                    onClick={onProceedToCheckout}
                    className="w-full bg-[#15472B] hover:bg-[#0D2F1C] text-white text-[12px] font-bold uppercase tracking-[0.1em] py-4 shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                  >
                    Proceed To Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Trust Guarantees */}
                  <div className="pt-4 border-t border-[#E2DED6] space-y-2 text-[11px] text-[#666666]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#15472B] shrink-0" />
                      <span>100% Cash on Delivery &amp; Bank Transfer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-[#15472B] shrink-0" />
                      <span>Certified Single-Origin Purity Guaranteed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Products Row ("You May Also Like") */}
        {recommendedProducts && recommendedProducts.length > 0 && (
          <section className="mt-16 sm:mt-20 pt-12 border-t border-[#EEEEEE]">
            <h2 className="text-[20px] sm:text-[24px] font-bold text-[#1F1F1F] mb-6">
              You May Also Like
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
