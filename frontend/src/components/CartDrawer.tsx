import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, Check, Loader2 } from 'lucide-react';
import { useStore, PlacedOrder } from '../context/StoreContext';
import { createOrder } from '../services/api';

const formatPKR = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    cartCount,
    subtotal,
    shippingFee,
    orderTotal,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    addPlacedOrder,
  } = useStore();

  const [checkoutStep, setCheckoutStep] = useState<'bag' | 'checkout' | 'confirmed'>('bag');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('Lahore');
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [drawerSubmitting, setDrawerSubmitting] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  if (!cartDrawerOpen) return null;

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim() || cart.length === 0) return;

    setDrawerSubmitting(true);
    setDrawerError(null);

    try {
      const orderPayload = {
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
        },
        shippingAddress: {
          city: customerCity,
          address: customerAddress.trim(),
        },
        items: cart.map((it) => ({
          productId: it.product.mongoId || it.product.id,
          quantity: it.quantity,
        })),
        paymentMethod: 'Cash on Delivery' as const,
      };

      const res = await createOrder(orderPayload);
      const code = res.order.orderReference;

      const newOrder: PlacedOrder = {
        id: code,
        customerName: customerName.trim(),
        city: customerCity,
        total: res.order.total ?? orderTotal,
        itemCount: cartCount,
        status: 'Confirmed — Preparing Cold-Packed Parcel at Islamabad Hub',
      };

      addPlacedOrder(newOrder);
      setConfirmedOrderId(code);
      clearCart();
      setCheckoutStep('confirmed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place order';
      setDrawerError(msg);
    } finally {
      setDrawerSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="px-6 py-4 border-b border-[#EAEAEA] flex items-center justify-between">
          <h2 className="text-[14px] uppercase tracking-[0.08em] font-semibold text-[#111111]">
            {checkoutStep === 'bag'
              ? `Shopping Bag (${cartCount})`
              : checkoutStep === 'checkout'
              ? 'Cash on Delivery Details'
              : 'Order Confirmed'}
          </h2>
          <button
            type="button"
            onClick={() => setCartDrawerOpen(false)}
            aria-label="Close shopping bag"
            className="p-1.5 text-[#444444] hover:text-black cursor-pointer rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {checkoutStep === 'confirmed' ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-11 h-11 mx-auto rounded-full bg-[#EEF5EB] text-[#1D5A2A] flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="font-serif-brand text-[22px] text-[#181818]">
                Thank you, {customerName}
              </h3>
              <p className="text-[13.5px] text-[#555555]">
                Order <strong className="text-[#181818]">{confirmedOrderId}</strong> is confirmed for Cash on Delivery to {customerCity}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  setCheckoutStep('bag');
                }}
                className="mt-4 px-6 py-2.5 bg-[#224D26] hover:bg-[#15472B] text-white text-[12px] uppercase tracking-[0.06em] cursor-pointer shadow-sm transition-colors"
              >
                Done
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-[14.5px] text-[#555555]">Your shopping bag is empty.</p>
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/shop');
                }}
                className="px-5 py-2 bg-[#15472B] hover:bg-[#0F3620] text-white text-[12px] uppercase tracking-[0.06em] cursor-pointer"
              >
                Browse Our Shop
              </button>
            </div>
          ) : checkoutStep === 'bag' ? (
            <div className="space-y-5">
              <div className="p-3 bg-[#F6F9F4] border border-[#DCEAD5] text-[12.5px] text-[#1D5A2A]">
                {subtotal >= 1200
                  ? 'Your order qualifies for Free Shipping across Pakistan!'
                  : `Add ${formatPKR(1200 - subtotal)} more for Free Shipping across Pakistan.`}
              </div>

              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-4 pb-5 border-b border-[#F0F0F0]">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 object-contain p-1 bg-[#FAF9F6] border border-[#EAEAEA] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.05em] text-[#666666]">
                      {product.brand}
                    </p>
                    <h4 className="text-[14px] font-medium text-[#181818] truncate">
                      {product.name}
                    </h4>
                    <p className="text-[13px] text-[#444444] tabular-nums mt-0.5">
                      {formatPKR(product.price)}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="inline-flex items-center border border-[#D4D4D4]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, -1)}
                          aria-label="Decrease quantity"
                          className="p-1.5 hover:bg-[#F5F5F5] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-[13px] tabular-nums font-semibold">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, 1)}
                          aria-label="Increase quantity"
                          className="p-1.5 hover:bg-[#F5F5F5] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        aria-label="Remove item"
                        className="p-1 text-[#777777] hover:text-red-600 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form id="cod-checkout-form" onSubmit={handleConfirmOrder} className="space-y-4">
              {drawerError && (
                <div className="p-3 bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-[12.5px]">
                  {drawerError}
                </div>
              )}

              <div>
                <label className="block text-[12px] uppercase tracking-[0.05em] text-[#444444] mb-1 font-semibold">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ayesha Khan"
                  className="w-full border border-[#D4D4D4] px-3 py-2 text-[13.5px] focus:outline-none focus:border-[#224D26]"
                />
              </div>
              <div>
                <label className="block text-[12px] uppercase tracking-[0.05em] text-[#444444] mb-1 font-semibold">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="03XX-XXXXXXX"
                  className="w-full border border-[#D4D4D4] px-3 py-2 text-[13.5px] focus:outline-none focus:border-[#224D26]"
                />
              </div>
              <div>
                <label className="block text-[12px] uppercase tracking-[0.05em] text-[#444444] mb-1 font-semibold">
                  City
                </label>
                <select
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="w-full border border-[#D4D4D4] px-3 py-2 text-[13.5px] bg-white focus:outline-none focus:border-[#224D26]"
                >
                  <option>Lahore</option>
                  <option>Karachi</option>
                  <option>Islamabad</option>
                  <option>Rawalpindi</option>
                  <option>Peshawar</option>
                  <option>Multan</option>
                  <option>Faisalabad</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] uppercase tracking-[0.05em] text-[#444444] mb-1 font-semibold">
                  Delivery Address
                </label>
                <textarea
                  required
                  rows={3}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="House, street, sector or block"
                  className="w-full border border-[#D4D4D4] px-3 py-2 text-[13.5px] focus:outline-none focus:border-[#224D26]"
                />
              </div>
            </form>
          )}
        </div>

        {cart.length > 0 && checkoutStep !== 'confirmed' && (
          <div className="px-6 py-5 border-t border-[#EAEAEA] bg-[#FAF9F6] space-y-3">
            <div className="flex justify-between text-[13px] text-[#555555] tabular-nums">
              <span>Subtotal</span>
              <span>{formatPKR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[13px] text-[#555555] tabular-nums">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? 'Free' : formatPKR(shippingFee)}</span>
            </div>
            <div className="flex justify-between text-[15px] font-semibold text-[#181818] pt-2 border-t border-[#E5E3DC] tabular-nums">
              <span>Total (COD)</span>
              <span>{formatPKR(orderTotal)}</span>
            </div>
            {checkoutStep === 'bag' ? (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setCartDrawerOpen(false);
                    navigate('/cart');
                  }}
                  className="w-full py-2.5 border border-[#181818] bg-white hover:bg-[#181818] hover:text-white text-[#181818] text-[12px] uppercase tracking-[0.08em] font-medium transition-colors cursor-pointer"
                >
                  View Full Cart Page
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCartDrawerOpen(false);
                    setCheckoutStep('bag');
                    navigate('/checkout');
                  }}
                  className="w-full py-3 bg-[#224D26] hover:bg-[#193A1C] text-white text-[12.5px] uppercase tracking-[0.08em] font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  Proceed to Checkout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('bag')}
                  className="px-4 py-3 border border-[#D4D4D4] bg-white text-[12px] uppercase tracking-[0.06em] cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="cod-checkout-form"
                  disabled={drawerSubmitting}
                  className="flex-1 py-3 bg-[#224D26] hover:bg-[#193A1C] disabled:bg-[#888888] text-white text-[12.5px] uppercase tracking-[0.08em] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  {drawerSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <span>Confirm Order</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
