import React, { useState, useEffect, useCallback } from 'react';
import { Check, Package, Search, Truck, Loader2 } from 'lucide-react';
import { trackOrder, TrackOrderResponse } from '../services/api';

export interface TrackedOrderRecord {
  id: string;
  customerName: string;
  city: string;
  total: number;
  itemCount: number;
  status: string;
  createdAt?: string;
}

interface OrderTrackingPageProps {
  placedOrders: TrackedOrderRecord[];
  initialOrderId?: string;
  onNavigateHome: () => void;
  onNavigateShop: () => void;
  onNavigateShipping: () => void;
  onNavigateContact: () => void;
}

interface TrackingDetails {
  orderId: string;
  recipient: string;
  city: string;
  paymentLabel: string;
  totalLabel: string;
  courierCode: string;
  etaText: string;
  currentStep: 1 | 2 | 3 | 4;
  statusSummary: string;
}

const formatPKR = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

const DISPATCH_STEPS = [
  {
    step: 1,
    title: 'Order Confirmed',
    detail: 'Harvest batch verified at our Chakwal Road Orchard Hub, Islamabad.',
  },
  {
    step: 2,
    title: 'Cold-Packed & Sealed',
    detail: 'Dark-glass bottles cushioned in protective insulated sleeves.',
  },
  {
    step: 3,
    title: 'In Transit via TCS Express',
    detail: 'Linehaul parcel travelling to your destination city dispatch hub.',
  },
  {
    step: 4,
    title: 'Out for Delivery',
    detail: 'Rider en route for doorstep handover and Cash on Delivery collection.',
  },
] as const;

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  placedOrders,
  initialOrderId = '',
  onNavigateHome,
  onNavigateShop,
  onNavigateShipping,
  onNavigateContact,
}) => {
  const [queryId, setQueryId] = useState(initialOrderId);
  const [tracked, setTracked] = useState<TrackingDetails | null>(null);
  const [validationNotice, setValidationNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const performTracking = useCallback(async (rawId: string) => {
    const cleaned = rawId.trim().toUpperCase();
    if (!cleaned) return;

    setLoading(true);
    setValidationNotice(null);

    try {
      const data = await trackOrder(cleaned);
      const step = (Number(data.trackingStage) || 2) as 1 | 2 | 3 | 4;
      const count = data.items?.length || data.itemCount || 1;

      setTracked({
        orderId: data.orderReference,
        recipient: data.customerName || 'Valued Customer',
        city: data.city || 'Pakistan',
        paymentLabel: `${count} ${count === 1 ? 'item' : 'items'} · ${data.paymentMethod}`,
        totalLabel: formatPKR(data.total),
        courierCode: data.courierTrackingCode || `TCS-${data.orderReference.replace(/[^0-9]/g, '') || '4821'}`,
        etaText: data.etaText || data.estimatedDelivery || 'Estimated delivery in 2–3 working days',
        currentStep: Math.min(Math.max(step, 1), 4) as 1 | 2 | 3 | 4,
        statusSummary: data.statusSummary || data.orderStatus,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Order not found';
      setTracked(null);
      setValidationNotice(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialOrderId.trim()) {
      const normalized = initialOrderId.trim().toUpperCase();
      setQueryId(normalized);
      performTracking(normalized);
    } else if (placedOrders.length > 0 && !tracked) {
      const latest = placedOrders[0];
      setQueryId(latest.id);
      performTracking(latest.id);
    }
  }, [initialOrderId, placedOrders, performTracking]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = queryId.trim().toUpperCase();
    if (!cleaned) {
      setValidationNotice('Please enter an order reference number such as ZP-1042.');
      return;
    }
    performTracking(cleaned);
  };

  const handleSelectQuickOrder = (orderId: string) => {
    setQueryId(orderId);
    performTracking(orderId);
  };

  return (
    <main className="w-full bg-white py-10 sm:py-12 lg:py-14">
      <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Top Breadcrumb: Home / Order Tracking */}
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
          <span className="text-[#444444]">Order Tracking</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-10 border-b border-[#EAEAEA]">
          <div>
            <p className="text-[11.5px] uppercase tracking-[0.12em] text-[#C46B3B] font-semibold mb-1.5">
              TCS Express &amp; COD Dispatch
            </p>
            <h1 className="text-[30px] sm:text-[36px] font-normal text-[#181818] leading-tight">
              Track Your Order
            </h1>
            <p className="mt-1.5 text-[14px] text-[#666666] max-w-[58ch]">
              Enter your Zaitoon Pakistan reference number to follow cold-packed parcels from our Islamabad orchard hub to your doorstep.
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateShop}
            className="self-start sm:self-auto border border-[#181818] bg-white hover:bg-[#181818] hover:text-white px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#181818] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            CONTINUE SHOPPING
          </button>
        </div>

        {/* Lookup & Quick Select Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Search Form & Recent References */}
          <section className="lg:col-span-5 space-y-6">
            <div className="bg-[#FAF3F0] p-7 sm:p-8 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E6DDD2]">
                <Package className="w-5 h-5 text-[#15472B] shrink-0" />
                <h2 className="text-[19px] font-normal text-[#181818]">
                  Find Dispatch Status
                </h2>
              </div>

              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <label
                    htmlFor="track-order-id"
                    className="block text-[11.5px] uppercase tracking-[0.07em] text-[#444444] mb-1.5"
                  >
                    Order Reference Number
                  </label>
                  <div className="relative">
                    <input
                      id="track-order-id"
                      type="text"
                      value={queryId}
                      onChange={(e) => setQueryId(e.target.value)}
                      placeholder="e.g. ZP-1042"
                      className="w-full bg-white border border-[#D4D4D4] pl-3.5 pr-10 py-3 text-[14px] uppercase text-[#181818] focus:outline-none focus:border-[#181818]"
                    />
                    <Search className="w-4 h-4 text-[#777777] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {validationNotice && (
                  <p className="text-[12.5px] text-[#C46B3B]">{validationNotice}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#0B0B0B] hover:bg-[#15472B] disabled:bg-[#888888] text-white text-[12px] font-semibold uppercase tracking-[0.09em] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>TRACKING SHIPMENT...</span>
                    </>
                  ) : (
                    <span>TRACK SHIPMENT</span>
                  )}
                </button>
              </form>

              {/* Session Orders */}
              {placedOrders.length > 0 && (
                <div className="pt-4 border-t border-[#E6DDD2] space-y-2.5">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#666666]">
                    Your Recent Session Orders
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {placedOrders.map((ord) => (
                      <button
                        key={ord.id}
                        type="button"
                        onClick={() => handleSelectQuickOrder(ord.id)}
                        className={`px-3 py-1.5 border text-[12.5px] tabular-nums transition-colors cursor-pointer ${
                          tracked?.orderId === ord.id
                            ? 'border-[#15472B] bg-[#15472B] text-white'
                            : 'border-[#D4D4D4] bg-white text-[#181818] hover:border-[#181818]'
                        }`}
                      >
                        {ord.id} · {ord.city}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Sample References */}
              <div className="pt-4 border-t border-[#E6DDD2] space-y-2.5">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#666666]">
                  Sample Dispatch References
                </p>
                <div className="flex flex-wrap gap-2">
                  {['ZP-1042', 'ZP-1088'].map((sampleId) => (
                    <button
                      key={sampleId}
                      type="button"
                      onClick={() => handleSelectQuickOrder(sampleId)}
                      className={`px-3 py-1.5 border text-[12px] tabular-nums transition-colors cursor-pointer ${
                        tracked?.orderId === sampleId
                          ? 'border-[#181818] bg-[#181818] text-white'
                          : 'border-[#D4D4D4] bg-white text-[#444444] hover:border-[#181818]'
                      }`}
                    >
                      {sampleId}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery Support Box */}
            <div className="border border-[#EAEAEA] p-6 space-y-3 text-[13.5px] text-[#555555]">
              <h3 className="text-[16px] font-normal text-[#181818]">
                Need assistance with delivery?
              </h3>
              <p className="leading-relaxed">
                Parcels are sealed with tamper-evident cork wraps. If a glass bottle arrives damaged in transit, we replace it free of charge within 7 days.
              </p>
              <div className="pt-1 flex flex-wrap gap-5 text-[12px] font-semibold uppercase tracking-[0.08em]">
                <button
                  type="button"
                  onClick={onNavigateShipping}
                  className="text-[#181818] hover:text-[#C46B3B] transition-colors cursor-pointer"
                >
                  Shipping &amp; Returns &rarr;
                </button>
                <button
                  type="button"
                  onClick={onNavigateContact}
                  className="text-[#181818] hover:text-[#C46B3B] transition-colors cursor-pointer"
                >
                  Contact Support &rarr;
                </button>
              </div>
            </div>
          </section>

          {/* Right Column: Tracking Results & Timeline */}
          <section className="lg:col-span-7">
            {tracked ? (
              <div className="border border-[#EAEAEA] bg-white p-7 sm:p-9 space-y-8">
                {/* Summary Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#EFEFEF]">
                  <div>
                    <p className="text-[11.5px] uppercase tracking-[0.1em] text-[#C46B3B] font-semibold tabular-nums">
                      Reference {tracked.orderId} · {tracked.courierCode}
                    </p>
                    <h2 className="mt-1.5 text-[22px] sm:text-[25px] font-normal text-[#181818]">
                      {tracked.statusSummary}
                    </h2>
                    <p className="mt-1 text-[13.5px] text-[#15472B] font-medium">
                      {tracked.etaText}
                    </p>
                  </div>
                  <div className="w-11 h-11 bg-[#FAF3F0] text-[#15472B] flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                </div>

                {/* Shipment Metadata Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 bg-[#FAF9F6] p-5 text-[13.5px]">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#777777]">
                      Recipient
                    </p>
                    <p className="mt-1 text-[#181818] font-medium">{tracked.recipient}</p>
                    <p className="text-[#666666]">{tracked.city}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#777777]">
                      Origin Hub
                    </p>
                    <p className="mt-1 text-[#181818] font-medium">Islamabad Orchard Hub</p>
                    <p className="text-[#666666]">Potohar Cold Storage</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#777777]">
                      Parcel &amp; Total
                    </p>
                    <p className="mt-1 text-[#181818] font-medium tabular-nums">
                      {tracked.totalLabel}
                    </p>
                    <p className="text-[#666666] tabular-nums">{tracked.paymentLabel}</p>
                  </div>
                </div>

                {/* 4-Step Dispatch Timeline */}
                <div>
                  <h3 className="text-[16px] font-normal text-[#181818] mb-5">
                    Courier Journey
                  </h3>
                  <ol className="space-y-5">
                    {DISPATCH_STEPS.map((item) => {
                      const isDone = item.step < tracked.currentStep;
                      const isCurrent = item.step === tracked.currentStep;
                      const isActiveOrDone = isDone || isCurrent;
                      return (
                        <li
                          key={item.step}
                          className="flex items-start gap-4 pb-5 border-b border-[#F2EFEA] last:border-b-0 last:pb-0"
                        >
                          <div
                            className={`w-8 h-8 flex items-center justify-center shrink-0 text-[12px] font-semibold tabular-nums border ${
                              isCurrent
                                ? 'bg-[#15472B] border-[#15472B] text-white'
                                : isDone
                                ? 'bg-[#FAF3F0] border-[#C46B3B] text-[#C46B3B]'
                                : 'bg-white border-[#DEDEDE] text-[#999999]'
                            }`}
                          >
                            {isDone ? <Check className="w-4 h-4" /> : `0${item.step}`}
                          </div>
                          <div>
                            <p
                              className={`text-[15px] ${
                                isActiveOrDone
                                  ? 'text-[#181818] font-medium'
                                  : 'text-[#888888]'
                              }`}
                            >
                              {item.title}
                              {isCurrent && (
                                <span className="ml-2 text-[11.5px] uppercase tracking-[0.08em] text-[#C46B3B] font-semibold">
                                  · Current Stage
                                </span>
                              )}
                            </p>
                            <p className="mt-1 text-[13px] text-[#666666] leading-relaxed">
                              {item.detail}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="border border-[#EAEAEA] bg-[#FAF9F6] py-16 px-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-[#FAF3F0] text-[#15472B] flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <h2 className="text-[22px] font-normal text-[#181818]">
                  Enter your order reference to begin
                </h2>
                <p className="text-[14px] text-[#555555] max-w-[46ch] mx-auto leading-relaxed">
                  You will find your <span className="tabular-nums font-medium text-[#181818]">ZP-XXXX</span> confirmation code on your checkout receipt or SMS dispatch alert.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};
