import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { CartPageItem } from './CartPage';
import { validateCoupon, createOrder } from '../services/api';

interface CheckoutPageProps {
  items: CartPageItem[];
  subtotal: number;
  shippingFee: number;
  onPlaceOrder?: (details: {
    name: string;
    phone: string;
    email: string;
    city: string;
    area: string;
    address: string;
    notes: string;
    paymentMethod: 'Cash on Delivery' | 'Bank Transfer (IBFT)';
    discountAmount: number;
    finalTotal: number;
    orderReference?: string;
  }) => string | void;
  onTrackOrder: (orderId: string) => void;
  onNavigateHome: () => void;
  onNavigateCart: () => void;
  onNavigateShop: () => void;
}

const formatPKR = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

interface ConfirmedSnapshot {
  orderId: string;
  courierCode?: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  paymentMethod: string;
  total: number;
  items: CartPageItem[];
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  subtotal,
  shippingFee,
  onPlaceOrder,
  onTrackOrder,
  onNavigateHome,
  onNavigateCart,
  onNavigateShop,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Lahore');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<
    'Cash on Delivery' | 'Bank Transfer (IBFT)'
  >('Cash on Delivery');

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [serverDiscount, setServerDiscount] = useState<number>(0);
  const [promoNotice, setPromoNotice] = useState<string | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Submitting state & error
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedSnapshot | null>(null);

  const discountAmount = appliedPromo ? serverDiscount : 0;
  const effectiveSubtotal = Math.max(0, subtotal - discountAmount);
  const effectiveShipping = effectiveSubtotal === 0 || effectiveSubtotal >= 1200 ? 0 : shippingFee;
  const finalTotal = effectiveSubtotal + effectiveShipping;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    setValidatingPromo(true);
    setPromoNotice(null);

    try {
      const res = await validateCoupon(code, subtotal);
      if (res.valid) {
        setAppliedPromo(code);
        setServerDiscount(res.discountAmount);
        setPromoNotice(res.message || `Coupon ${code} applied successfully!`);
      } else {
        setAppliedPromo(null);
        setServerDiscount(0);
        setPromoNotice(res.message || 'Invalid or expired promo code.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to validate coupon';
      setAppliedPromo(null);
      setServerDiscount(0);
      setPromoNotice(message);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim() || items.length === 0) return;

    setSubmitting(true);
    setSubmitError(null);

    const fullAddress = area.trim() ? `${address.trim()}, ${area.trim()}` : address.trim();
    const snapshotItems = [...items];

    try {
      const orderPayload = {
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
        },
        shippingAddress: {
          city,
          area: area.trim() || undefined,
          address: fullAddress,
          notes: notes.trim() || undefined,
        },
        items: items.map((it) => ({
          productId: it.product.mongoId || it.product.id,
          quantity: it.quantity,
        })),
        paymentMethod: paymentMethod === 'Cash on Delivery' ? ('Cash on Delivery' as const) : ('Bank Transfer (IBFT)' as const),
        couponCode: appliedPromo || undefined,
      };

      const res = await createOrder(orderPayload);
      const orderRef = res.order.orderReference;
      const courierCode = res.order.courierTrackingCode || `TCS-${orderRef.replace(/[^0-9]/g, '')}`;

      // Notify parent to clear cart or update order count
      if (onPlaceOrder) {
        onPlaceOrder({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city,
          area: area.trim(),
          address: fullAddress,
          notes: notes.trim(),
          paymentMethod,
          discountAmount,
          finalTotal: res.order.total ?? finalTotal,
          orderReference: orderRef,
        });
      }

      setConfirmedOrder({
        orderId: orderRef,
        courierCode,
        name: name.trim(),
        phone: phone.trim(),
        city,
        address: fullAddress,
        paymentMethod,
        total: res.order.total ?? finalTotal,
        items: snapshotItems,
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to place order. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="w-full bg-white py-10 sm:py-12 lg:py-14">
      <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Top Breadcrumb: Home / Cart / Checkout */}
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
          <button
            type="button"
            onClick={onNavigateCart}
            className="hover:text-[#181818] transition-colors cursor-pointer"
          >
            Cart
          </button>
          <span aria-hidden="true">/</span>
          <span className="text-[#444444]">Checkout</span>
        </nav>

        {/* Page Title & Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-8 border-b border-[#EAEAEA]">
          <div>
            <p className="text-[11.5px] uppercase tracking-[0.12em] text-[#C46B3B] font-semibold mb-1.5">
              Islamabad Orchard Dispatch
            </p>
            <h1 className="text-[30px] sm:text-[36px] font-normal text-[#181818] leading-tight">
              {confirmedOrder ? 'Order Confirmed' : 'Checkout'}
            </h1>
          </div>

          {!confirmedOrder && (
            <button
              type="button"
              onClick={onNavigateCart}
              className="self-start sm:self-auto border border-[#181818] bg-white hover:bg-[#181818] hover:text-white px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#181818] transition-colors cursor-pointer shrink-0"
            >
              RETURN TO CART
            </button>
          )}
        </div>

        {/* Confirmed Order Receipt */}
        {confirmedOrder ? (
          <div className="max-w-[780px] mx-auto bg-[#FAF3F0] p-8 sm:p-12 space-y-7">
            <div className="flex items-start gap-4 pb-6 border-b border-[#E6DDD2]">
              <div className="w-11 h-11 bg-white text-[#15472B] flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11.5px] uppercase tracking-[0.1em] text-[#C46B3B] font-semibold">
                  Reference {confirmedOrder.orderId}
                </p>
                <h2 className="mt-1 text-[24px] sm:text-[28px] font-normal text-[#181818]">
                  Thank you, {confirmedOrder.name}
                </h2>
                <p className="mt-1.5 text-[14px] text-[#555555]">
                  Your parcel is confirmed for dispatch via TCS Express (Tracking #{confirmedOrder.courierCode}) from our Islamabad Orchard Hub.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-[13.5px]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#777777]">Recipient</p>
                <p className="mt-1 text-[#181818]">{confirmedOrder.name}</p>
                <p className="text-[#555555] tabular-nums">{confirmedOrder.phone}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#777777]">
                  Delivery Address
                </p>
                <p className="mt-1 text-[#181818]">
                  {confirmedOrder.address}, {confirmedOrder.city}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#777777]">
                  Payment &amp; Total
                </p>
                <p className="mt-1 text-[#181818]">{confirmedOrder.paymentMethod}</p>
                <p className="font-semibold text-[#15472B] tabular-nums">
                  {formatPKR(confirmedOrder.total)}
                </p>
              </div>
            </div>

            {confirmedOrder.paymentMethod.includes('Bank Transfer') && (
              <div className="bg-[#FAF9F5] border border-[#D5CBB8] p-5 text-[13.5px] space-y-2">
                <p className="font-semibold text-[#181818]">Meezan Bank IBFT Instructions:</p>
                <p className="text-[#444444]">Bank: <strong>Meezan Bank Limited</strong></p>
                <p className="text-[#444444]">Account Title: <strong>Zaitoon Pakistan Pvt Ltd</strong></p>
                <p className="text-[#444444]">Account Number / IBAN: <strong>PK82MEZN0001090105892341</strong></p>
                <p className="text-[#666666] text-[12px] pt-1">
                  Please mention order reference <strong>{confirmedOrder.orderId}</strong> in your transfer description.
                </p>
              </div>
            )}

            <div className="bg-white border border-[#EAE0D5] p-5 divide-y divide-[#F2EFEA]">
              {confirmedOrder.items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-[13.5px]"
                >
                  <span className="text-[#181818]">
                    {product.name}{' '}
                    <span className="text-[#777777] tabular-nums">× {quantity}</span>
                  </span>
                  <span className="text-[#181818] tabular-nums shrink-0">
                    {formatPKR(product.price * quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onTrackOrder(confirmedOrder.orderId)}
                className="bg-[#0B0B0B] hover:bg-[#15472B] text-white text-[11.5px] font-semibold uppercase tracking-[0.09em] px-7 py-3.5 transition-colors cursor-pointer"
              >
                TRACK THIS ORDER
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmedOrder(null);
                  onNavigateShop();
                }}
                className="border border-[#181818] bg-white hover:bg-[#181818] hover:text-white text-[#181818] text-[11.5px] font-semibold uppercase tracking-[0.09em] px-7 py-3.5 transition-colors cursor-pointer"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          /* Empty Cart Guard */
          <div className="border border-[#EAEAEA] bg-[#FAF9F6] py-16 px-6 text-center">
            <p className="text-[16px] text-[#444444] mb-5">
              Your cart is empty. Add cold-pressed olive oil or orchard goods before checking out.
            </p>
            <button
              type="button"
              onClick={onNavigateShop}
              className="inline-flex items-center justify-center bg-[#0B0B0B] hover:bg-[#15472B] text-white text-[11.5px] font-semibold uppercase tracking-[0.09em] px-8 py-3.5 transition-colors cursor-pointer"
            >
              BROWSE SHOP
            </button>
          </div>
        ) : (
          /* 2-Column Checkout Form + Order Summary */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left Column: Customer & Delivery Form */}
            <form
              id="checkout-page-form"
              onSubmit={handleSubmit}
              className="lg:col-span-7 space-y-8"
            >
              {submitError && (
                <div className="p-4 bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-[13.5px]">
                  {submitError}
                </div>
              )}

              {/* Step 1: Contact Details */}
              <section className="border border-[#EAEAEA] p-6 sm:p-8 space-y-5">
                <h2 className="text-[19px] font-normal text-[#181818] pb-3 border-b border-[#EFEFEF]">
                  1. Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="chk-name"
                      className="block text-[11.5px] uppercase tracking-[0.07em] text-[#444444] mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="chk-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ayesha Siddiqui"
                      className="w-full border border-[#D4D4D4] px-3.5 py-2.5 text-[13.5px] text-[#181818] focus:outline-none focus:border-[#181818]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="chk-phone"
                      className="block text-[11.5px] uppercase tracking-[0.07em] text-[#444444] mb-1.5"
                    >
                      Mobile Number
                    </label>
                    <input
                      id="chk-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="03XX-XXXXXXX"
                      className="w-full border border-[#D4D4D4] px-3.5 py-2.5 text-[13.5px] text-[#181818] focus:outline-none focus:border-[#181818]"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="chk-email"
                    className="block text-[11.5px] uppercase tracking-[0.07em] text-[#444444] mb-1.5"
                  >
                    Email Address (For Dispatch &amp; Tracking Alerts)
                  </label>
                  <input
                    id="chk-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com (optional)"
                    className="w-full border border-[#D4D4D4] px-3.5 py-2.5 text-[13.5px] text-[#181818] focus:outline-none focus:border-[#181818]"
                  />
                </div>
              </section>

              {/* Step 2: Shipping Destination */}
              <section className="border border-[#EAEAEA] p-6 sm:p-8 space-y-5">
                <h2 className="text-[19px] font-normal text-[#181818] pb-3 border-b border-[#EFEFEF]">
                  2. Shipping Destination
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="chk-city"
                      className="block text-[11.5px] uppercase tracking-[0.07em] text-[#444444] mb-1.5"
                    >
                      City
                    </label>
                    <select
                      id="chk-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full border border-[#D4D4D4] px-3.5 py-2.5 text-[13.5px] text-[#181818] bg-white focus:outline-none focus:border-[#181818]"
                    >
                      <option>Lahore</option>
                      <option>Karachi</option>
                      <option>Islamabad</option>
                      <option>Rawalpindi</option>
                      <option>Peshawar</option>
                      <option>Multan</option>
                      <option>Faisalabad</option>
                      <option>Quetta</option>
                      <option>Sialkot</option>
                      <option>Gujranwala</option>
                      <option>Chakwal</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="chk-area"
                      className="block text-[11.5px] uppercase tracking-[0.07em] text-[#444444] mb-1.5"
                    >
                      Sector / Area / Colony
                    </label>
                    <input
                      id="chk-area"
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. F-7/2 or DHA Phase 5"
                      className="w-full border border-[#D4D4D4] px-3.5 py-2.5 text-[13.5px] text-[#181818] focus:outline-none focus:border-[#181818]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="chk-address"
                    className="block text-[11.5px] uppercase tracking-[0.07em] text-[#444444] mb-1.5"
                  >
                    Complete Street Address
                  </label>
                  <textarea
                    id="chk-address"
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House number, street name, nearest landmark"
                    className="w-full border border-[#D4D4D4] px-3.5 py-2.5 text-[13.5px] text-[#181818] focus:outline-none focus:border-[#181818]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="chk-notes"
                    className="block text-[11.5px] uppercase tracking-[0.07em] text-[#444444] mb-1.5"
                  >
                    Delivery Notes / Instructions (Optional)
                  </label>
                  <input
                    id="chk-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Call before arrival, leave with security"
                    className="w-full border border-[#D4D4D4] px-3.5 py-2.5 text-[13.5px] text-[#181818] focus:outline-none focus:border-[#181818]"
                  />
                </div>
              </section>

              {/* Step 3: Payment Method */}
              <section className="border border-[#EAEAEA] p-6 sm:p-8 space-y-4">
                <h2 className="text-[19px] font-normal text-[#181818] pb-3 border-b border-[#EFEFEF]">
                  3. Payment Method
                </h2>

                <div className="space-y-3">
                  <label className="flex items-start gap-3.5 p-4 border border-[#EAEAEA] bg-[#FAF9F6] cursor-pointer">
                    <input
                      type="radio"
                      name="payment-method"
                      value="Cash on Delivery"
                      checked={paymentMethod === 'Cash on Delivery'}
                      onChange={() => setPaymentMethod('Cash on Delivery')}
                      className="mt-1 accent-[#15472B]"
                    />
                    <div>
                      <span className="block text-[14px] font-medium text-[#181818]">
                        Cash on Delivery (Nationwide COD)
                      </span>
                      <span className="block text-[12.5px] text-[#666666] mt-0.5">
                        Pay cash to the TCS rider upon doorstep delivery anywhere across Pakistan.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3.5 p-4 border border-[#EAEAEA] bg-[#FAF9F6] cursor-pointer">
                    <input
                      type="radio"
                      name="payment-method"
                      value="Bank Transfer (IBFT)"
                      checked={paymentMethod === 'Bank Transfer (IBFT)'}
                      onChange={() => setPaymentMethod('Bank Transfer (IBFT)')}
                      className="mt-1 accent-[#15472B]"
                    />
                    <div>
                      <span className="block text-[14px] font-medium text-[#181818]">
                        Direct Bank Transfer (IBFT)
                      </span>
                      <span className="block text-[12.5px] text-[#666666] mt-0.5">
                        Transfer directly to Zaitoon Pakistan’s Meezan Bank account; IBFT details are shared immediately upon confirmation.
                      </span>
                    </div>
                  </label>
                </div>
              </section>
            </form>

            {/* Right Column: Sticky Order Summary */}
            <aside
              aria-label="Order summary"
              className="lg:col-span-5 bg-[#FAF3F0] p-7 sm:p-8 space-y-6 lg:sticky lg:top-28"
            >
              <h2 className="text-[20px] font-normal text-[#181818] pb-3 border-b border-[#E6DDD2]">
                Your Order
              </h2>

              {/* Line Items */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center justify-between gap-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-14 object-cover bg-white shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[13.5px] text-[#181818] truncate">{product.name}</p>
                        <p className="text-[12px] text-[#666666] tabular-nums flex items-center gap-1.5">
                          <span>{product.size} · Qty {quantity}</span>
                          {product.isDeal && (
                            <span className="border border-[#D03B3B] bg-white text-[#D03B3B] text-[10px] font-bold px-1 py-0.2">
                              {product.dealBadge || `-${product.discountPercent}%`}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {product.isDeal && product.originalPrice && product.originalPrice > product.price && (
                        <span className="block text-[11px] text-[#888888] line-through font-mono-data">
                          {formatPKR(product.originalPrice * quantity)}
                        </span>
                      )}
                      <span className="text-[13.5px] font-semibold text-[#181818] tabular-nums font-mono-data">
                        {formatPKR(product.price * quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Harvest Promo Code */}
              <form onSubmit={handleApplyPromo} className="pt-4 border-t border-[#E6DDD2] space-y-2">
                <label
                  htmlFor="promo-code"
                  className="block text-[11px] uppercase tracking-[0.07em] text-[#555555]"
                >
                  Promo Code (e.g. ZAITOON10, HARVEST500)
                </label>
                <div className="flex gap-2">
                  <input
                    id="promo-code"
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 border border-[#D4D4D4] bg-white px-3 py-2 text-[13px] uppercase focus:outline-none focus:border-[#181818]"
                  />
                  <button
                    type="submit"
                    disabled={validatingPromo}
                    className="px-4 py-2 bg-[#181818] hover:bg-[#15472B] disabled:bg-[#888888] text-white text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer"
                  >
                    {validatingPromo ? 'CHECKING...' : 'APPLY'}
                  </button>
                </div>
                {promoNotice && (
                  <p
                    className={`text-[12px] ${
                      appliedPromo ? 'text-[#15472B] font-medium' : 'text-[#C46B3B]'
                    }`}
                  >
                    {promoNotice}
                  </p>
                )}
              </form>

              {/* Totals Breakdown */}
              <div className="pt-4 border-t border-[#E6DDD2] space-y-2.5 text-[13.5px] tabular-nums">
                <div className="flex items-center justify-between text-[#555555]">
                  <span>Subtotal</span>
                  <span className="text-[#181818]">{formatPKR(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-[#C46B3B]">
                    <span>Harvest Discount ({appliedPromo})</span>
                    <span>-{formatPKR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[#555555]">
                  <span>Shipping</span>
                  <span className="text-[#181818]">
                    {effectiveShipping === 0 ? 'Free' : formatPKR(effectiveShipping)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#E6DDD2] text-[17px] font-medium text-[#181818]">
                  <span>Total ({paymentMethod === 'Cash on Delivery' ? 'COD' : 'IBFT'})</span>
                  <span>{formatPKR(finalTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-page-form"
                disabled={submitting}
                className="w-full py-3.5 bg-[#0B0B0B] hover:bg-[#15472B] disabled:bg-[#888888] text-white text-[12px] font-semibold uppercase tracking-[0.09em] transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>PLACING ORDER...</span>
                  </>
                ) : (
                  <span>PLACE ORDER · {formatPKR(finalTotal)}</span>
                )}
              </button>

              <p className="text-[12px] text-[#666666] leading-relaxed">
                Protected by our 7-day transit breakage replacement &amp; cold-pressed purity guarantee.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
};
