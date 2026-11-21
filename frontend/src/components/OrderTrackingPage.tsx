import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Search,
  Truck,
  Loader2,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { trackOrder, simulatePayfastSuccess } from '../services/api';

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
  isPayfastSuccess?: boolean;
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
  courierName: string;
  courierCode: string;
  trackingUrl?: string;
  etaText: string;
  currentStep: 1 | 2 | 3 | 4;
  statusSummary: string;
}

const formatPKR = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

const DISPATCH_STEPS = [
  {
    step: 1,
    title: 'Order Confirmed',
    detail: 'Harvest batch verified at our Islamabad Hub.',
    icon: CheckCircle2,
  },
  {
    step: 2,
    title: 'Cold-Packed & Sealed',
    detail: 'Protected in UV-insulated packaging sleeves.',
    icon: Package,
  },
  {
    step: 3,
    title: 'In Transit (TCS Express)',
    detail: 'Dispatched to destination regional hub.',
    icon: Truck,
  },
  {
    step: 4,
    title: 'Out for Delivery',
    detail: 'Courier en route for doorstep COD handover.',
    icon: MapPin,
  },
] as const;

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  placedOrders,
  initialOrderId = '',
  isPayfastSuccess = false,
  onNavigateHome,
  onNavigateShop,
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
        courierName: data.courierName || 'TCS Express Pakistan',
        courierCode:
          data.courierTrackingCode ||
          `TCS-${data.orderReference.replace(/[^0-9]/g, '') || '4821'}`,
        trackingUrl: data.trackingUrl || '',
        etaText:
          data.etaText ||
          data.estimatedDelivery ||
          'Estimated delivery in 2–3 working days',
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
      if (isPayfastSuccess) {
        // Settle sandbox payment on return so order status is instantly confirmed as Paid
        simulatePayfastSuccess(normalized)
          .catch(() => {})
          .finally(() => {
            performTracking(normalized);
          });
      } else {
        performTracking(normalized);
      }
    } else if (placedOrders.length > 0 && !tracked) {
      const latest = placedOrders[0];
      setQueryId(latest.id);
      performTracking(latest.id);
    }
  }, [initialOrderId, isPayfastSuccess, placedOrders, performTracking]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = queryId.trim().toUpperCase();
    if (!cleaned) {
      setValidationNotice('Please enter a valid order reference (e.g. ZP-2026-XXXX)');
      return;
    }
    performTracking(cleaned);
  };

  return (
    <main className="w-full bg-white text-[#333333] font-sans antialiased">
      {/* =========================================================================
          1. BREADCRUMBS ROW (Exact format: Home > Order Tracking with divider)
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
            Order Tracking
          </span>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Title & Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-[26px] sm:text-[34px] font-extrabold uppercase tracking-tight text-[#1F1F1F]">
            Track Your Order
          </h1>
          <p className="mt-2 text-[13.5px] text-[#666666] leading-relaxed">
            Enter your order reference code below to view live dispatch verification, courier movement, and estimated arrival.
          </p>
        </div>

        {/* PayFast Success Alert Banner */}
        {isPayfastSuccess && (
          <div className="max-w-2xl mx-auto mb-8 p-5 border border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46] shadow-sm flex items-start gap-3.5">
            <CheckCircle2 className="w-6 h-6 text-[#047857] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[15px] text-[#065F46]">
                PayFast Payment Confirmed!
              </h3>
              <p className="text-[13px] text-[#047857] mt-1 leading-relaxed">
                Thank you! Your payment has been captured and verified via PayFast Sandbox. Your order is locked in and currently undergoing cold-packing at our Islamabad Orchard Hub.
              </p>
            </div>
          </div>
        )}

        {/* Lookup Search Form Box */}
        <div className="max-w-2xl mx-auto bg-[#FAF8F5] border border-[#EBE7DF] p-6 sm:p-8 mb-12 shadow-sm">
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                placeholder="Enter Order Reference (e.g. ZP-2026-4821)"
                className="w-full h-[46px] bg-white border border-[#D5D0C5] px-4 text-[13.5px] text-[#222222] uppercase tracking-wider placeholder-[#999999] focus:outline-none focus:border-[#15472B]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-[46px] px-8 bg-[#15472B] hover:bg-[#0D2F1C] disabled:bg-[#888888] text-white text-[12px] font-bold uppercase tracking-[0.1em] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Tracking...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </form>

          {/* Recent Orders Quick Buttons */}
          {placedOrders.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#E2DED6] flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#777777] font-medium">Recent Orders:</span>
              {placedOrders.slice(0, 3).map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => {
                    setQueryId(rec.id);
                    performTracking(rec.id);
                  }}
                  className="bg-white hover:bg-[#15472B] hover:text-white border border-[#D5D0C5] text-[#1F1F1F] px-2.5 py-1 font-semibold tracking-wider transition-colors cursor-pointer"
                >
                  {rec.id}
                </button>
              ))}
            </div>
          )}

          {validationNotice && (
            <div className="mt-4 p-3 bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-[12.5px]">
              {validationNotice}
            </div>
          )}
        </div>

        {/* Live Tracking Result */}
        {tracked ? (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Tracking Status Header Banner */}
            <div className="bg-[#FAF8F5] border border-[#EBE7DF] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#C46B3B]">
                  Live Dispatch Status
                </span>
                <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1F1F1F] mt-0.5">
                  Order #{tracked.orderId}
                </h2>
                <p className="text-[12.5px] text-[#666666] mt-0.5">
                  Deliver to {tracked.recipient} · {tracked.city}
                </p>
              </div>

              <div className="sm:text-right">
                <span className="inline-block bg-[#15472B]/10 text-[#15472B] text-[11px] font-bold uppercase tracking-wider px-3 py-1 mb-1">
                  {tracked.statusSummary}
                </span>
                <p className="text-[12.5px] text-[#555555] font-medium">
                  {tracked.etaText}
                </p>
              </div>
            </div>

            {/* 4-Step Progress Stepper */}
            <div className="border border-[#EEEEEE] p-6 sm:p-8 bg-white shadow-sm">
              <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-[#1F1F1F] mb-6">
                Delivery Progress
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-4 relative">
                {DISPATCH_STEPS.map((s, idx) => {
                  const isCompleted = tracked.currentStep >= s.step;
                  const isCurrent = tracked.currentStep === s.step;
                  const Icon = s.icon;

                  return (
                    <div key={s.step} className="flex sm:flex-col items-start sm:items-center sm:text-center gap-4 sm:gap-2 relative">
                      {/* Step Circle */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                          isCompleted
                            ? 'bg-[#15472B] border-[#15472B] text-white'
                            : 'bg-white border-[#DDDDDD] text-[#999999]'
                        } ${isCurrent ? 'ring-4 ring-[#15472B]/20' : ''}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Step Labels */}
                      <div className="sm:mt-2">
                        <h4
                          className={`text-[13px] font-bold ${
                            isCompleted ? 'text-[#1F1F1F]' : 'text-[#888888]'
                          }`}
                        >
                          {s.title}
                        </h4>
                        <p className="text-[11px] text-[#777777] mt-0.5 leading-snug">
                          {s.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Details & Courier Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-[#FAF8F5] border border-[#EBE7DF] p-6 space-y-3 text-[13px]">
                <h4 className="text-[12px] font-extrabold uppercase tracking-wider text-[#1F1F1F] pb-2 border-b border-[#E2DED6]">
                  Consignment &amp; Courier Details
                </h4>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Courier Partner:</span>
                  <span className="font-semibold text-[#1F1F1F]">{tracked.courierName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#666666]">Tracking Number:</span>
                  {tracked.trackingUrl ? (
                    <a
                      href={tracked.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono font-bold text-[#15472B] hover:underline flex items-center gap-1"
                    >
                      <span>{tracked.courierCode}</span>
                      <ArrowRight className="w-3 h-3 inline" />
                    </a>
                  ) : (
                    <span className="font-mono font-bold text-[#15472B]">{tracked.courierCode}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Origin Dispatch:</span>
                  <span className="font-semibold text-[#1F1F1F]">Islamabad Central Hub</span>
                </div>
              </div>

              <div className="bg-[#FAF8F5] border border-[#EBE7DF] p-6 space-y-3 text-[13px]">
                <h4 className="text-[12px] font-extrabold uppercase tracking-wider text-[#1F1F1F] pb-2 border-b border-[#E2DED6]">
                  Payment &amp; Package Summary
                </h4>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Payment Status:</span>
                  <span className="font-semibold text-[#1F1F1F]">{tracked.paymentLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Total Amount:</span>
                  <span className="font-bold text-[#15472B]">{tracked.totalLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Security Seal:</span>
                  <span className="font-semibold text-[#15472B]">Tamper-Proof Wax Seal</span>
                </div>
              </div>
            </div>

            {/* Support Callout */}
            <div className="p-5 border border-[#EEEEEE] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white text-xs text-[#666666]">
              <span>Need help with this delivery? Our customer desk is active Monday–Saturday 9am–9pm.</span>
              <button
                type="button"
                onClick={onNavigateContact}
                className="text-[#15472B] font-bold uppercase tracking-wider hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Contact Dispatch Desk &rarr;</span>
              </button>
            </div>
          </div>
        ) : (
          /* Default Empty State / Information Guide */
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-[#666666]">
            <div className="p-5 border border-[#EEEEEE] bg-[#FAF8F5]">
              <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-[#15472B]" />
              <h3 className="font-bold text-[#1F1F1F] text-[13px] mb-1">Cold-Chain Verification</h3>
              <p>Every lot is temperature-monitored from pressing through delivery.</p>
            </div>
            <div className="p-5 border border-[#EEEEEE] bg-[#FAF8F5]">
              <Truck className="w-6 h-6 mx-auto mb-2 text-[#15472B]" />
              <h3 className="font-bold text-[#1F1F1F] text-[13px] mb-1">TCS Express Network</h3>
              <p>Fast doorstep transit across all 150+ major cities in Pakistan.</p>
            </div>
            <div className="p-5 border border-[#EEEEEE] bg-[#FAF8F5]">
              <Clock className="w-6 h-6 mx-auto mb-2 text-[#15472B]" />
              <h3 className="font-bold text-[#1F1F1F] text-[13px] mb-1">Cash on Delivery</h3>
              <p>Inspect your wax-sealed bottle before paying the courier rider.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
