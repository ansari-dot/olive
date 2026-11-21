import React, { useEffect, useState } from 'react';
import {
  Search,
  X,
  Truck,
  CreditCard,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  RotateCcw,
  Package,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import {
  DEFAULT_IMAGE_PLACEHOLDER,
  cancelAdminOrder,
  fetchAdminOrderDetail,
  fetchAdminOrders,
  initiateCourierShipment,
  processAdminOrderReturn,
  resolveAssetUrl,
  syncAdminOrderTracking,
  updateAdminOrderPayment,
  updateAdminOrderStatus,
  updateAdminOrderTracking,
} from '../services/adminApi';
import type { AdminOrder, OrderStatus, PaymentStatus } from '../types/admin';
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  formatDateTime,
  formatPKR,
} from '../utils/formatters';

interface OrdersViewProps {
  initialOrderReference?: string | null;
  onClearInitialOrder?: () => void;
}

const ORDER_STAGES: OrderStatus[] = [
  'confirmed',
  'cold_packed',
  'dispatched',
  'out_for_delivery',
  'delivered',
];

const COURIER_PROVIDERS = [
  { id: 'tcs', name: 'TCS Express' },
  { id: 'leopards', name: 'Leopards Courier' },
  { id: 'trax', name: 'Trax Logistics' },
  { id: 'mnp', name: 'M&P Express Logistics' },
  { id: 'mock', name: 'Sandbox / Mock Provider' },
];

export const OrdersView: React.FC<OrdersViewProps> = ({
  initialOrderReference,
  onClearInitialOrder,
}) => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [courierProviderFilter, setCourierProviderFilter] = useState('all');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detail & Actions Drawer
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Form states inside drawer
  const [nextStatus, setNextStatus] = useState<OrderStatus>('cold_packed');
  const [statusNote, setStatusNote] = useState('');
  const [courierName, setCourierName] = useState('TCS Express');
  const [courierTrackingCode, setCourierTrackingCode] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [nextPaymentStatus, setNextPaymentStatus] = useState<PaymentStatus>('pending_cod');
  const [ibftReference, setIbftReference] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelBox, setShowCancelBox] = useState(false);

  // Courier booking state
  const [bookingProvider, setBookingProvider] = useState<'tcs' | 'leopards' | 'trax' | 'mnp' | 'mock'>('tcs');
  const [parcelWeightKg, setParcelWeightKg] = useState('0.5');
  const [shipmentRemarks, setShipmentRemarks] = useState('');
  const [showAttempts, setShowAttempts] = useState(false);

  // Return state
  const [returnAction, setReturnAction] = useState<'inspect' | 'approve_and_restock' | 'reject'>('inspect');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnRestockQty, setReturnRestockQty] = useState('1');
  const [showReturnBox, setShowReturnBox] = useState(false);

  const loadOrders = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOrders({
        orderStatus: statusFilter,
        paymentMethod: paymentFilter,
        paymentStatus: paymentStatusFilter,
        courierProvider: courierProviderFilter,
        shipmentStatus: shipmentStatusFilter,
        city: cityFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search.trim() || undefined,
        page: targetPage,
        limit: 15,
      });
      setOrders(data.orders);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    statusFilter,
    paymentFilter,
    paymentStatusFilter,
    courierProviderFilter,
    shipmentStatusFilter,
    cityFilter,
    startDate,
    endDate,
  ]);

  const syncDrawerForms = (order: AdminOrder) => {
    setNextStatus(
      order.orderStatus === 'cancelled' || order.orderStatus === 'returned'
        ? 'confirmed'
        : order.orderStatus === 'delivered'
        ? 'delivered'
        : ORDER_STAGES[Math.min(ORDER_STAGES.indexOf(order.orderStatus) + 1, ORDER_STAGES.length - 1)] ||
          order.orderStatus
    );
    setStatusNote('');
    setCourierName(order.courierName || 'TCS Express');
    setCourierTrackingCode(order.shipment?.trackingNumber || order.courierTrackingCode || '');
    setEstimatedDelivery(order.estimatedDelivery || '2–3 working days via TCS Express');
    setNextPaymentStatus(order.paymentStatus);
    setIbftReference(order.ibftReference || '');
    setCancelReason('');
    setShowCancelBox(false);

    // Courier booking defaults
    const currentProvider = (order.shipment?.provider || 'tcs') as any;
    setBookingProvider(currentProvider);
    setParcelWeightKg(String(order.shipment?.parcelWeightKg || 0.5));
    setShipmentRemarks('');
    setShowAttempts(false);

    // Return defaults
    const totalQty = order.items.reduce((s, it) => s + it.quantity, 0);
    setReturnRestockQty(String(totalQty));
    setReturnNotes(order.returnDetails?.auditNote || '');
    setShowReturnBox(false);
  };

  const openOrderDrawer = async (orderReference: string) => {
    setDrawerLoading(true);
    setActionNotice(null);
    try {
      const detail = await fetchAdminOrderDetail(orderReference);
      setSelectedOrder(detail);
      syncDrawerForms(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order details.');
    } finally {
      setDrawerLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderReference) {
      void openOrderDrawer(initialOrderReference);
      onClearInitialOrder?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderReference]);

  const handleAdvanceStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionBusy(true);
    setActionNotice(null);
    try {
      const updated = await updateAdminOrderStatus(selectedOrder.orderReference, {
        orderStatus: nextStatus,
        note: statusNote.trim() || undefined,
      });
      setSelectedOrder(updated);
      syncDrawerForms(updated);
      setActionNotice(`Order updated to ${ORDER_STATUS_META[updated.orderStatus]?.label}.`);
      await loadOrders(page);
    } catch (err) {
      setActionNotice(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleBookCourierShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionBusy(true);
    setActionNotice(null);
    try {
      const updated = await initiateCourierShipment(selectedOrder.orderReference, {
        provider: bookingProvider,
        parcelWeightKg: parseFloat(parcelWeightKg) || 0.5,
        remarks: shipmentRemarks.trim() || undefined,
      });
      setSelectedOrder(updated);
      syncDrawerForms(updated);
      setActionNotice(
        `Consignment booked with ${updated.courierName}. Tracking: ${updated.shipment?.trackingNumber}`
      );
      await loadOrders(page);
    } catch (err) {
      setActionNotice(err instanceof Error ? err.message : 'Courier booking failed.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleSyncTracking = async () => {
    if (!selectedOrder) return;
    setActionBusy(true);
    setActionNotice(null);
    try {
      const res = await syncAdminOrderTracking(selectedOrder.orderReference);
      setSelectedOrder(res.order);
      syncDrawerForms(res.order);
      setActionNotice('Courier tracking synchronized successfully with logistics provider.');
      await loadOrders(page);
    } catch (err) {
      setActionNotice(err instanceof Error ? err.message : 'Failed to sync tracking.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionBusy(true);
    setActionNotice(null);
    try {
      const updated = await processAdminOrderReturn(selectedOrder.orderReference, {
        action: returnAction,
        inspectionNotes: returnNotes.trim() || undefined,
        restockQuantity: parseInt(returnRestockQty, 10) || undefined,
      });
      setSelectedOrder(updated);
      syncDrawerForms(updated);
      setActionNotice(`Return action "${returnAction}" processed.`);
      await loadOrders(page);
    } catch (err) {
      setActionNotice(err instanceof Error ? err.message : 'Failed to process return.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleUpdateTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionBusy(true);
    setActionNotice(null);
    try {
      const updated = await updateAdminOrderTracking(selectedOrder.orderReference, {
        courierName: courierName.trim(),
        courierTrackingCode: courierTrackingCode.trim(),
        estimatedDelivery: estimatedDelivery.trim(),
      });
      setSelectedOrder(updated);
      syncDrawerForms(updated);
      setActionNotice('Courier tracking record updated.');
      await loadOrders(page);
    } catch (err) {
      setActionNotice(err instanceof Error ? err.message : 'Failed to update tracking.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionBusy(true);
    setActionNotice(null);
    try {
      const updated = await updateAdminOrderPayment(selectedOrder.orderReference, {
        paymentStatus: nextPaymentStatus,
        ibftReference: ibftReference.trim() || undefined,
      });
      setSelectedOrder(updated);
      syncDrawerForms(updated);
      setActionNotice('Payment record updated.');
      await loadOrders(page);
    } catch (err) {
      setActionNotice(err instanceof Error ? err.message : 'Failed to update payment.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !cancelReason.trim()) return;
    setActionBusy(true);
    setActionNotice(null);
    try {
      const updated = await cancelAdminOrder(selectedOrder.orderReference, cancelReason.trim());
      setSelectedOrder(updated);
      syncDrawerForms(updated);
      setActionNotice('Order cancelled and inventory restored atomically.');
      await loadOrders(page);
    } catch (err) {
      setActionNotice(err instanceof Error ? err.message : 'Failed to cancel order.');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-[#0F172A]">
            Order Management &amp; Multi-Courier Dispatch
          </h2>
          <p className="text-[13px] text-[#64748B] font-mono-data">
            {total} total orders · Atomic inventory protection active
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void loadOrders(1);
          }}
          className="flex flex-wrap items-center gap-2.5"
        >
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ZP-XXXX, tracking, phone, customer..."
              className="w-[260px] sm:w-[320px] border border-[#CBD5E1] bg-white pl-3.5 pr-9 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
            />
            <Search className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            type="submit"
            className="bg-[#15472B] hover:bg-[#0F3620] text-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] cursor-pointer"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => void loadOrders(page)}
            aria-label="Refresh orders"
            className="border border-[#CBD5E1] bg-white hover:border-[#0F172A] p-2 text-[#334155] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* Advanced Filters Row */}
      <div className="bg-white border border-[#E2E8F0] p-4 flex flex-wrap items-center gap-3">
        {/* Date Range */}
        <div className="flex items-center gap-2 text-[12.5px] text-[#475569]">
          <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
          <span>From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-[#CBD5E1] bg-white px-2 py-1 text-[12px] text-[#0F172A]"
          />
          <span>To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-[#CBD5E1] bg-white px-2 py-1 text-[12px] text-[#0F172A]"
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-[11px] text-[#C46B3B] underline cursor-pointer"
            >
              Clear Dates
            </button>
          )}
        </div>

        <div className="h-4 w-[1px] bg-[#E2E8F0] hidden sm:block" />

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by order status"
          className="border border-[#CBD5E1] bg-white px-3 py-1.5 text-[12.5px] text-[#0F172A]"
        >
          <option value="all">All Order Stages</option>
          <option value="confirmed">Confirmed (Stage 1)</option>
          <option value="cold_packed">Cold-Packed (Stage 2)</option>
          <option value="dispatched">Dispatched (Stage 3)</option>
          <option value="out_for_delivery">Out for Delivery (Stage 4)</option>
          <option value="delivered">Delivered (Stage 4)</option>
          <option value="returned">Returned (Stage 0)</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Courier Provider Filter */}
        <select
          value={courierProviderFilter}
          onChange={(e) => setCourierProviderFilter(e.target.value)}
          aria-label="Filter by courier provider"
          className="border border-[#CBD5E1] bg-white px-3 py-1.5 text-[12.5px] text-[#0F172A]"
        >
          <option value="all">All Courier Services</option>
          <option value="tcs">TCS Express</option>
          <option value="leopards">Leopards Courier</option>
          <option value="trax">Trax Logistics</option>
          <option value="mnp">M&amp;P Logistics</option>
          <option value="mock">Sandbox / Mock</option>
        </select>

        {/* Payment Method Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          aria-label="Filter by payment method"
          className="border border-[#CBD5E1] bg-white px-3 py-1.5 text-[12.5px] text-[#0F172A]"
        >
          <option value="all">All Payment Methods</option>
          <option value="Cash on Delivery">Cash on Delivery</option>
          <option value="Bank Transfer (IBFT)">Bank Transfer (IBFT)</option>
        </select>

        {/* Payment Status Filter */}
        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          aria-label="Filter by payment status"
          className="border border-[#CBD5E1] bg-white px-3 py-1.5 text-[12.5px] text-[#0F172A]"
        >
          <option value="all">All Payment States</option>
          <option value="pending_cod">Pending COD</option>
          <option value="awaiting_ibft">Awaiting IBFT</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>

        {/* City Filter */}
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          aria-label="Filter by city"
          className="border border-[#CBD5E1] bg-white px-3 py-1.5 text-[12.5px] text-[#0F172A]"
        >
          <option value="all">All Pakistan Cities</option>
          <option value="Islamabad">Islamabad</option>
          <option value="Lahore">Lahore</option>
          <option value="Karachi">Karachi</option>
          <option value="Rawalpindi">Rawalpindi</option>
          <option value="Peshawar">Peshawar</option>
          <option value="Multan">Multan</option>
          <option value="Faisalabad">Faisalabad</option>
        </select>
      </div>

      {error && (
        <div className="border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white border border-[#E2E8F0] overflow-x-auto">
        {loading && orders.length === 0 ? (
          <div className="p-8 text-center text-[13.5px] text-[#64748B]">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-[14px] text-[#64748B]">
            No orders match the selected filters.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-3 px-4 text-left font-semibold">Order Ref</th>
                <th className="py-3 px-4 text-left font-semibold">Customer</th>
                <th className="py-3 px-4 text-left font-semibold">Destination &amp; Courier</th>
                <th className="py-3 px-4 text-left font-semibold">Payment</th>
                <th className="py-3 px-4 text-left font-semibold">Status &amp; Stock</th>
                <th className="py-3 px-4 text-right font-semibold">Total</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {orders.map((ord) => {
                const stMeta = ORDER_STATUS_META[ord.orderStatus];
                const payMeta = PAYMENT_STATUS_META[ord.paymentStatus];
                const trackingNumber =
                  ord.shipment?.trackingNumber || ord.courierTrackingCode;
                const trackingUrl = ord.shipment?.trackingUrl;
                const isRestocked =
                  ord.inventoryState === 'restored' ||
                  ord.returnDetails?.status === 'restocked';

                return (
                  <tr key={ord._id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4">
                      <span className="font-mono-data font-semibold text-[#15472B]">
                        {ord.orderReference}
                      </span>
                      <p className="text-[11px] text-[#64748B] font-mono-data">
                        {formatDateTime(ord.createdAt)}
                      </p>
                      {ord.returnDetails?.status && ord.returnDetails.status !== 'none' && (
                        <span className="inline-block mt-1 bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF] px-1.5 py-0.5 text-[10px] uppercase font-bold rounded">
                          Return: {ord.returnDetails.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#0F172A]">{ord.customer?.name}</p>
                      <p className="text-[12px] text-[#64748B] font-mono-data">
                        {ord.customer?.phone}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-[#0F172A]">{ord.shippingAddress?.city}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-[#475569] font-medium">
                          {ord.courierName || 'Pending Courier'}
                        </span>
                        {trackingNumber && (
                          trackingUrl ? (
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-[#15472B] hover:underline font-mono-data flex items-center gap-0.5"
                            >
                              <span>{trackingNumber}</span>
                              <ExternalLink className="w-2.5 h-2.5 inline" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-[#64748B] font-mono-data">
                              {trackingNumber}
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-[#0F172A]">{ord.paymentMethod}</p>
                      <p className={`text-[11.5px] font-medium ${payMeta?.colorClass ?? ''}`}>
                        {payMeta?.label ?? ord.paymentStatus}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-medium ${stMeta?.colorClass ?? ''}`}>
                          {stMeta?.label ?? ord.orderStatus}
                        </span>
                        {isRestocked && (
                          <span className="bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded">
                            Restocked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B] font-mono-data">
                        Stage {ord.trackingStage}/4 · {ord.inventoryState || 'deducted'}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-data font-semibold text-[#0F172A]">
                      {formatPKR(ord.total)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => void openOrderDrawer(ord.orderReference)}
                        className="border border-[#CBD5E1] hover:border-[#15472B] px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#0F172A] cursor-pointer whitespace-nowrap"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[12.5px] text-[#475569]">
          <span className="font-mono-data">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => void loadOrders(page - 1)}
              className="border border-[#CBD5E1] bg-white disabled:opacity-40 px-3 py-1.5 cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => void loadOrders(page + 1)}
              className="border border-[#CBD5E1] bg-white disabled:opacity-40 px-3 py-1.5 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Order Detail & Dispatch Control Drawer */}
      {(selectedOrder || drawerLoading) && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full max-w-[660px] bg-white h-full flex flex-col border-l border-[#E2E8F0]">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C46B3B] font-semibold">
                  Order &amp; Courier Dispatch Control
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-[18px] font-semibold text-[#0F172A] font-mono-data">
                    {selectedOrder ? selectedOrder.orderReference : 'Loading...'}
                  </h3>
                  {selectedOrder?.idempotencyKey && (
                    <span className="text-[10px] font-mono-data bg-[#F1F5F9] text-[#64748B] px-1.5 py-0.5 rounded">
                      Idempotent
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order drawer"
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {drawerLoading || !selectedOrder ? (
              <div className="p-8 text-[14px] text-[#64748B]">Loading order record...</div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {actionNotice && (
                  <div className="border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-2.5 text-[13px] text-[#15803D] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{actionNotice}</span>
                  </div>
                )}

                {/* Customer & Shipping Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-[13px]">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.06em] text-[#64748B]">
                      Customer Info
                    </p>
                    <p className="mt-1 font-medium text-[#0F172A]">
                      {selectedOrder.customer?.name}
                    </p>
                    <p className="font-mono-data text-[#475569]">
                      {selectedOrder.customer?.phone}
                    </p>
                    {selectedOrder.customer?.email && (
                      <p className="text-[#475569]">{selectedOrder.customer.email}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.06em] text-[#64748B]">
                      Shipping Address
                    </p>
                    <p className="mt-1 font-medium text-[#0F172A]">
                      {selectedOrder.shippingAddress?.city}
                      {selectedOrder.shippingAddress?.area
                        ? ` · ${selectedOrder.shippingAddress.area}`
                        : ''}
                    </p>
                    <p className="text-[#475569]">{selectedOrder.shippingAddress?.address}</p>
                    {selectedOrder.shippingAddress?.notes && (
                      <p className="mt-1 text-[12px] text-[#C46B3B]">
                        Note: {selectedOrder.shippingAddress.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items & PKR Price Snapshots */}
                <div className="border border-[#E2E8F0] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#334155]">
                      Items Ordered ({selectedOrder.items.length})
                    </h4>
                    <span className="text-[11px] font-mono-data px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                      Stock: {selectedOrder.inventoryState || 'deducted'}
                    </span>
                  </div>
                  <div className="divide-y divide-[#F1F5F9]">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-[13px]">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.image && (
                            <img
                              src={resolveAssetUrl(item.image)}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src !== DEFAULT_IMAGE_PLACEHOLDER) {
                                  target.onerror = null;
                                  target.src = DEFAULT_IMAGE_PLACEHOLDER;
                                }
                              }}
                              className="w-10 h-10 object-cover bg-[#FAF3F0] shrink-0 border border-[#E2E8F0]"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-[#0F172A] truncate">
                              {item.name}
                              {item.isDeal && (
                                <span className="ml-1.5 text-[10.5px] font-bold text-[#C2410C] bg-[#FFF7ED] px-1.5 py-0.5 rounded">
                                  FLASH DEAL (-{item.discountPercent}%)
                                </span>
                              )}
                            </p>
                            <p className="text-[11.5px] text-[#64748B] font-mono-data">
                              {item.size} · {formatPKR(item.price)} × {item.quantity}
                              {item.originalPrice && item.originalPrice !== item.price && (
                                <span className="line-through ml-1 text-[#94A3B8]">
                                  {formatPKR(item.originalPrice)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono-data font-medium text-[#0F172A] shrink-0">
                          {formatPKR(item.lineTotal ?? item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-[#E2E8F0] space-y-1 text-[13px] font-mono-data">
                    <div className="flex justify-between text-[#475569]">
                      <span>Subtotal</span>
                      <span>{formatPKR(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-[#C46B3B]">
                        <span>Coupon Discount ({selectedOrder.couponCode})</span>
                        <span>-{formatPKR(selectedOrder.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#475569]">
                      <span>Shipping Fee</span>
                      <span>
                        {selectedOrder.shippingFee === 0
                          ? 'FREE'
                          : formatPKR(selectedOrder.shippingFee)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#F1F5F9] text-[15px] font-semibold text-[#0F172A]">
                      <span>Payable Amount</span>
                      <span>{formatPKR(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Section 1: Multi-Courier Consignment Booking */}
                {selectedOrder.orderStatus !== 'cancelled' &&
                  selectedOrder.orderStatus !== 'returned' && (
                    <div className="border border-[#CBD5E1] bg-[#F8FAFC] p-4 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[13px] font-semibold text-[#0F172A] flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#15472B]" />
                          <span>1. Multi-Courier Dispatch &amp; Booking</span>
                        </h4>
                        {selectedOrder.shipment?.status &&
                          selectedOrder.shipment.status !== 'unshipped' && (
                            <span className="text-[11px] font-mono-data bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] px-2 py-0.5 rounded font-semibold uppercase">
                              {selectedOrder.shipment.provider?.toUpperCase()} · {selectedOrder.shipment.status}
                            </span>
                          )}
                      </div>

                      {/* If already booked with tracking code, show tracking actions */}
                      {(selectedOrder.shipment?.trackingNumber || selectedOrder.courierTrackingCode) ? (
                        <div className="bg-white border border-[#E2E8F0] p-3 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.06em] text-[#64748B]">
                                Active Consignment Number
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono-data font-bold text-[15px] text-[#15472B]">
                                  {selectedOrder.shipment?.trackingNumber || selectedOrder.courierTrackingCode}
                                </span>
                                {selectedOrder.shipment?.trackingUrl && (
                                  <a
                                    href={selectedOrder.shipment.trackingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[12px] text-[#1D4ED8] hover:underline flex items-center gap-1"
                                  >
                                    <span>Track Live</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={actionBusy}
                              onClick={handleSyncTracking}
                              className="border border-[#CBD5E1] hover:border-[#15472B] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#0F172A] flex items-center gap-1.5 cursor-pointer"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${actionBusy ? 'animate-spin' : ''}`} />
                              <span>Sync Live Courier Status</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#F1F5F9] text-[12px]">
                            <div>
                              <span className="text-[#64748B]">Provider:</span>{' '}
                              <strong className="text-[#0F172A]">{selectedOrder.courierName}</strong>
                            </div>
                            <div>
                              <span className="text-[#64748B]">Weight:</span>{' '}
                              <strong className="font-mono-data text-[#0F172A]">
                                {selectedOrder.shipment?.parcelWeightKg || 0.5} kg
                              </strong>
                            </div>
                            <div>
                              <span className="text-[#64748B]">COD Amount:</span>{' '}
                              <strong className="font-mono-data text-[#15472B]">
                                {formatPKR(selectedOrder.shipment?.codAmount ?? selectedOrder.total)}
                              </strong>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Booking Form (New or Re-booking) */}
                      <form onSubmit={handleBookCourierShipment} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] uppercase tracking-[0.06em] text-[#64748B] mb-1 font-semibold">
                              Courier Partner
                            </label>
                            <select
                              value={bookingProvider}
                              onChange={(e) => setBookingProvider(e.target.value as any)}
                              className="w-full border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-[12.5px] text-[#0F172A]"
                            >
                              {COURIER_PROVIDERS.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase tracking-[0.06em] text-[#64748B] mb-1 font-semibold">
                              Parcel Weight (KG)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={parcelWeightKg}
                              onChange={(e) => setParcelWeightKg(e.target.value)}
                              className="w-full border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-[12.5px] font-mono-data"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase tracking-[0.06em] text-[#64748B] mb-1 font-semibold">
                              COD Collection
                            </label>
                            <div className="border border-[#CBD5E1] bg-[#F1F5F9] px-2.5 py-1.5 text-[12.5px] font-mono-data text-[#0F172A]">
                              {selectedOrder.paymentMethod === 'Cash on Delivery' &&
                              selectedOrder.paymentStatus !== 'paid'
                                ? formatPKR(selectedOrder.total)
                                : 'Rs. 0 (Prepaid)'}
                            </div>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={shipmentRemarks}
                          onChange={(e) => setShipmentRemarks(e.target.value)}
                          placeholder="Optional courier special handling notes..."
                          className="w-full border border-[#CBD5E1] bg-white px-3 py-1.5 text-[12.5px]"
                        />

                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="submit"
                            disabled={actionBusy}
                            className="bg-[#15472B] hover:bg-[#0F3620] text-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.07em] cursor-pointer"
                          >
                            {selectedOrder.shipment?.trackingNumber
                              ? 'Re-book Consignment'
                              : 'Generate Courier Consignment'}
                          </button>

                          {(selectedOrder.shipment?.shipmentAttempts ?? []).length > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowAttempts((p) => !p)}
                              className="text-[11.5px] text-[#475569] underline cursor-pointer"
                            >
                              {showAttempts ? 'Hide' : 'View'} Booking History (
                              {selectedOrder.shipment?.shipmentAttempts?.length})
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Shipment Attempts History Drawer */}
                      {showAttempts && (
                        <div className="mt-3 border border-[#E2E8F0] bg-white p-3 space-y-2 text-[12px]">
                          <p className="font-semibold text-[#0F172A] uppercase tracking-[0.06em] text-[11px]">
                            Consignment Audit Log
                          </p>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto">
                            {(selectedOrder.shipment?.shipmentAttempts ?? []).map((att, idx) => (
                              <div
                                key={idx}
                                className="p-2 border border-[#F1F5F9] bg-[#F8FAFC] text-[11.5px]"
                              >
                                <div className="flex justify-between font-mono-data text-[#64748B]">
                                  <span>{att.provider?.toUpperCase()} · {att.action}</span>
                                  <span>{att.timestamp ? formatDateTime(att.timestamp) : ''}</span>
                                </div>
                                {att.error ? (
                                  <p className="text-[#DC2626] mt-1">Error: {att.error}</p>
                                ) : (
                                  <p className="text-[#16A34A] mt-1">Status: Success</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* Section 2: Advance Dispatch Stage */}
                {selectedOrder.orderStatus !== 'cancelled' &&
                  selectedOrder.orderStatus !== 'returned' && (
                    <form
                      onSubmit={handleAdvanceStatus}
                      className="border border-[#E2E8F0] p-4 space-y-3"
                    >
                      <h4 className="text-[13px] font-semibold text-[#0F172A] flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#15472B]" />
                        <span>2. Advance Dispatch Stage</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          value={nextStatus}
                          onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                          className="border border-[#CBD5E1] bg-white px-3 py-2 text-[13px]"
                        >
                          <option value="confirmed">Confirmed (Stage 1)</option>
                          <option value="cold_packed">Cold-Packed (Stage 2)</option>
                          <option value="dispatched">Dispatched (Stage 3)</option>
                          <option value="out_for_delivery">Out for Delivery (Stage 4)</option>
                          <option value="delivered">Delivered (Stage 4)</option>
                        </select>
                        <input
                          type="text"
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="Optional hub dispatch note"
                          className="border border-[#CBD5E1] px-3 py-2 text-[13px]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={actionBusy}
                        className="bg-[#15472B] hover:bg-[#0F3620] text-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.07em] cursor-pointer"
                      >
                        Update Dispatch Stage
                      </button>
                    </form>
                  )}

                {/* Section 3: Manual Courier Override */}
                <form
                  onSubmit={handleUpdateTracking}
                  className="border border-[#E2E8F0] p-4 space-y-3"
                >
                  <h4 className="text-[13px] font-semibold text-[#0F172A]">
                    3. Courier Tracking Override
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="Courier Name (e.g. TCS Express)"
                      className="border border-[#CBD5E1] px-3 py-2 text-[13px]"
                    />
                    <input
                      type="text"
                      value={courierTrackingCode}
                      onChange={(e) => setCourierTrackingCode(e.target.value)}
                      placeholder="Tracking Code"
                      className="border border-[#CBD5E1] px-3 py-2 text-[13px] font-mono-data uppercase"
                    />
                  </div>
                  <input
                    type="text"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    placeholder="Estimated delivery text"
                    className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px]"
                  />
                  <button
                    type="submit"
                    disabled={actionBusy}
                    className="border border-[#0F172A] hover:bg-[#0F172A] hover:text-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.07em] transition-colors cursor-pointer"
                  >
                    Save Tracking Details
                  </button>
                </form>

                {/* Section 4: Payment Verification */}
                <form
                  onSubmit={handleUpdatePayment}
                  className="border border-[#E2E8F0] p-4 space-y-3"
                >
                  <h4 className="text-[13px] font-semibold text-[#0F172A] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#15472B]" />
                    <span>4. Payment &amp; IBFT Verification</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={nextPaymentStatus}
                      onChange={(e) => setNextPaymentStatus(e.target.value as PaymentStatus)}
                      className="border border-[#CBD5E1] bg-white px-3 py-2 text-[13px]"
                    >
                      <option value="pending_cod">Pending COD</option>
                      <option value="awaiting_ibft">Awaiting IBFT</option>
                      <option value="paid">Paid / Verified</option>
                      <option value="refunded">Refunded</option>
                    </select>
                    <input
                      type="text"
                      value={ibftReference}
                      onChange={(e) => setIbftReference(e.target.value)}
                      placeholder="IBFT / COD receipt ref"
                      className="border border-[#CBD5E1] px-3 py-2 text-[13px] font-mono-data"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={actionBusy}
                    className="border border-[#0F172A] hover:bg-[#0F172A] hover:text-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.07em] transition-colors cursor-pointer"
                  >
                    Update Payment Status
                  </button>
                </form>

                {/* Section 5: Return Inspection & Restocking */}
                <div className="border border-[#E9D5FF] bg-[#FAF5FF] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-semibold text-[#6B21A8] flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      <span>5. Return Management &amp; Stock Recovery</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowReturnBox((p) => !p)}
                      className="text-[12px] font-semibold text-[#7E22CE] underline cursor-pointer"
                    >
                      {showReturnBox ? 'Hide' : 'Manage Return'}
                    </button>
                  </div>

                  {selectedOrder.returnDetails?.status && selectedOrder.returnDetails.status !== 'none' && (
                    <div className="bg-white border border-[#E9D5FF] p-3 text-[12.5px] space-y-1">
                      <p>
                        <span className="text-[#64748B]">Return Status:</span>{' '}
                        <strong className="text-[#6B21A8] uppercase">
                          {selectedOrder.returnDetails.status}
                        </strong>
                      </p>
                      {selectedOrder.returnDetails.reason && (
                        <p className="text-[#475569]">
                          Reason: {selectedOrder.returnDetails.reason}
                        </p>
                      )}
                      {selectedOrder.returnDetails.inspectedBy && (
                        <p className="text-[#475569]">
                          Inspected By: {selectedOrder.returnDetails.inspectedBy}
                        </p>
                      )}
                      {selectedOrder.returnDetails.auditNote && (
                        <p className="text-[#475569]">
                          Note: {selectedOrder.returnDetails.auditNote}
                        </p>
                      )}
                      {selectedOrder.returnDetails.restockedQuantity ? (
                        <p className="text-[#15803D] font-semibold">
                          Restocked Units: {selectedOrder.returnDetails.restockedQuantity}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {showReturnBox && (
                    <form onSubmit={handleProcessReturn} className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          value={returnAction}
                          onChange={(e) => setReturnAction(e.target.value as any)}
                          className="border border-[#D8B4FE] bg-white px-3 py-2 text-[12.5px]"
                        >
                          <option value="inspect">Record Inspection Notes</option>
                          <option value="approve_and_restock">Approve Return &amp; Restock Stock</option>
                          <option value="reject">Reject Return</option>
                        </select>
                        {returnAction === 'approve_and_restock' && (
                          <input
                            type="number"
                            min="1"
                            value={returnRestockQty}
                            onChange={(e) => setReturnRestockQty(e.target.value)}
                            placeholder="Units to Restock"
                            className="border border-[#D8B4FE] bg-white px-3 py-2 text-[12.5px] font-mono-data"
                          />
                        )}
                      </div>
                      <input
                        type="text"
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        placeholder="Inspection observations / seal verification notes..."
                        className="w-full border border-[#D8B4FE] bg-white px-3 py-2 text-[12.5px]"
                      />
                      <button
                        type="submit"
                        disabled={actionBusy}
                        className="bg-[#7E22CE] hover:bg-[#6B21A8] text-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.07em] cursor-pointer"
                      >
                        Execute Return Action
                      </button>
                    </form>
                  )}
                </div>

                {/* Section 6: Cancel Order & Restore Inventory */}
                {selectedOrder.orderStatus !== 'delivered' &&
                  selectedOrder.orderStatus !== 'cancelled' && (
                    <div className="border border-[#FECACA] bg-[#FEF2F2]/60 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[13px] font-semibold text-[#991B1B] flex items-center gap-2">
                          <AlertOctagon className="w-4 h-4" />
                          <span>6. Cancel Order &amp; Restore Inventory</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowCancelBox((prev) => !prev)}
                          className="text-[12px] font-semibold text-[#DC2626] underline cursor-pointer"
                        >
                          {showCancelBox ? 'Hide' : 'Cancel Order'}
                        </button>
                      </div>
                      {showCancelBox && (
                        <form onSubmit={handleCancelOrder} className="space-y-3">
                          <input
                            type="text"
                            required
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Reason for cancellation (e.g. Customer cancelled via phone)"
                            className="w-full border border-[#FCA5A5] bg-white px-3 py-2 text-[13px]"
                          />
                          <button
                            type="submit"
                            disabled={actionBusy}
                            className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.07em] cursor-pointer"
                          >
                            Confirm Cancellation &amp; Restore Stock
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                {/* Status Audit History */}
                <div className="border border-[#E2E8F0] p-4 space-y-3">
                  <h4 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#334155] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#15472B]" />
                    <span>Audit Status Timeline</span>
                  </h4>
                  {(selectedOrder.statusHistory ?? []).length === 0 ? (
                    <p className="text-[12.5px] text-[#64748B]">No timeline entries logged.</p>
                  ) : (
                    <ul className="space-y-2.5 text-[12.5px]">
                      {selectedOrder.statusHistory.map((entry, idx) => (
                        <li
                          key={idx}
                          className="pb-2.5 border-b border-[#F1F5F9] last:border-b-0 last:pb-0 flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="font-medium text-[#0F172A]">
                              Stage {entry.stage} · {entry.orderStatus}
                            </p>
                            {entry.note && <p className="text-[#475569]">{entry.note}</p>}
                            {entry.updatedBy && (
                              <p className="text-[11px] text-[#64748B]">By {entry.updatedBy}</p>
                            )}
                          </div>
                          <span className="font-mono-data text-[11px] text-[#64748B] shrink-0">
                            {formatDateTime(entry.timestamp)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
