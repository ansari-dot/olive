import React, { useEffect, useState } from 'react';
import {
  Search,
  X,
  Truck,
  CreditCard,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  cancelAdminOrder,
  fetchAdminOrderDetail,
  fetchAdminOrders,
  resolveAssetUrl,
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
  const [cityFilter, setCityFilter] = useState('all');

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

  const loadOrders = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOrders({
        orderStatus: statusFilter,
        paymentMethod: paymentFilter,
        paymentStatus: paymentStatusFilter,
        city: cityFilter,
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
  }, [statusFilter, paymentFilter, paymentStatusFilter, cityFilter]);

  const syncDrawerForms = (order: AdminOrder) => {
    setNextStatus(
      order.orderStatus === 'cancelled'
        ? 'confirmed'
        : order.orderStatus === 'delivered'
        ? 'delivered'
        : ORDER_STAGES[Math.min(ORDER_STAGES.indexOf(order.orderStatus) + 1, ORDER_STAGES.length - 1)] ||
          order.orderStatus
    );
    setStatusNote('');
    setCourierName(order.courierName || 'TCS Express');
    setCourierTrackingCode(order.courierTrackingCode || '');
    setEstimatedDelivery(order.estimatedDelivery || '2–3 working days via TCS Express');
    setNextPaymentStatus(order.paymentStatus);
    setIbftReference(order.ibftReference || '');
    setCancelReason('');
    setShowCancelBox(false);
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
      setActionNotice('TCS courier tracking updated.');
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
      setActionNotice('Order cancelled and product stock restored atomically.');
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
            Orders &amp; TCS Dispatch
          </h2>
          <p className="text-[13px] text-[#64748B] font-mono-data">
            {total} total records
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
              placeholder="Search ZP-XXXX, phone, customer..."
              className="w-[240px] sm:w-[270px] border border-[#CBD5E1] bg-white pl-3.5 pr-9 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
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

      {/* Filters Row */}
      <div className="bg-white border border-[#E2E8F0] p-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by order status"
          className="border border-[#CBD5E1] bg-white px-3 py-1.5 text-[12.5px] text-[#0F172A]"
        >
          <option value="all">All Dispatch Stages</option>
          <option value="confirmed">Confirmed (Stage 1)</option>
          <option value="cold_packed">Cold-Packed (Stage 2)</option>
          <option value="dispatched">Dispatched (Stage 3)</option>
          <option value="out_for_delivery">Out for Delivery (Stage 4)</option>
          <option value="delivered">Delivered (Stage 4)</option>
          <option value="cancelled">Cancelled</option>
        </select>

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

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          aria-label="Filter by city"
          className="border border-[#CBD5E1] bg-white px-3 py-1.5 text-[12.5px] text-[#0F172A]"
        >
          <option value="all">All Pakistan Cities</option>
          <option value="Lahore">Lahore</option>
          <option value="Islamabad">Islamabad</option>
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
                <th className="py-3 px-4 text-left font-semibold">City &amp; Courier</th>
                <th className="py-3 px-4 text-left font-semibold">Payment</th>
                <th className="py-3 px-4 text-left font-semibold">Dispatch Stage</th>
                <th className="py-3 px-4 text-right font-semibold">Total</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {orders.map((ord) => {
                const stMeta = ORDER_STATUS_META[ord.orderStatus];
                const payMeta = PAYMENT_STATUS_META[ord.paymentStatus];
                return (
                  <tr key={ord._id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4">
                      <span className="font-mono-data font-semibold text-[#15472B]">
                        {ord.orderReference}
                      </span>
                      <p className="text-[11px] text-[#64748B] font-mono-data">
                        {formatDateTime(ord.createdAt)}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#0F172A]">{ord.customer?.name}</p>
                      <p className="text-[12px] text-[#64748B] font-mono-data">
                        {ord.customer?.phone}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-[#0F172A]">{ord.shippingAddress?.city}</p>
                      <p className="text-[11.5px] text-[#64748B] font-mono-data">
                        {ord.courierTrackingCode || 'Pending TCS ID'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-[#0F172A]">{ord.paymentMethod}</p>
                      <p className={`text-[11.5px] font-medium ${payMeta?.colorClass ?? ''}`}>
                        {payMeta?.label ?? ord.paymentStatus}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${stMeta?.colorClass ?? ''}`}>
                        {stMeta?.label ?? ord.orderStatus}
                      </span>
                      <p className="text-[11px] text-[#64748B] font-mono-data">
                        Stage {ord.trackingStage}/4
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

      {/* Order Detail & Dispatch Actions Drawer */}
      {(selectedOrder || drawerLoading) && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full max-w-[620px] bg-white h-full flex flex-col border-l border-[#E2E8F0]">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C46B3B] font-semibold">
                  Order Dispatch Control
                </p>
                <h3 className="text-[18px] font-semibold text-[#0F172A] font-mono-data">
                  {selectedOrder ? selectedOrder.orderReference : 'Loading...'}
                </h3>
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
                      Customer
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

                {/* Items & PKR Summary */}
                <div className="border border-[#E2E8F0] p-4 space-y-3">
                  <h4 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#334155]">
                    Items ({selectedOrder.items.length})
                  </h4>
                  <div className="divide-y divide-[#F1F5F9]">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-[13px]">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.image && (
                            <img
                              src={resolveAssetUrl(item.image)}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-cover bg-[#FAF3F0] shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-[#0F172A] truncate">{item.name}</p>
                            <p className="text-[11.5px] text-[#64748B] font-mono-data">
                              {item.size} · {formatPKR(item.price)} × {item.quantity}
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
                        <span>Coupon ({selectedOrder.couponCode})</span>
                        <span>-{formatPKR(selectedOrder.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#475569]">
                      <span>Shipping</span>
                      <span>
                        {selectedOrder.shippingFee === 0
                          ? 'Free'
                          : formatPKR(selectedOrder.shippingFee)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#F1F5F9] text-[15px] font-semibold text-[#0F172A]">
                      <span>Total</span>
                      <span>{formatPKR(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Action 1: Dispatch Stage Progression */}
                {selectedOrder.orderStatus !== 'cancelled' && (
                  <form
                    onSubmit={handleAdvanceStatus}
                    className="border border-[#E2E8F0] p-4 space-y-3"
                  >
                    <h4 className="text-[13px] font-semibold text-[#0F172A] flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#15472B]" />
                      <span>1. Advance Dispatch Stage</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={nextStatus}
                        onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                        className="border border-[#CBD5E1] bg-white px-3 py-2 text-[13px]"
                      >
                        <option value="confirmed">Confirmed (Stage 1)</option>
                        <option value="cold_packed">Cold-Packed (Stage 2)</option>
                        <option value="dispatched">Dispatched via TCS (Stage 3)</option>
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

                {/* Action 2: TCS Courier Tracking */}
                <form
                  onSubmit={handleUpdateTracking}
                  className="border border-[#E2E8F0] p-4 space-y-3"
                >
                  <h4 className="text-[13px] font-semibold text-[#0F172A]">
                    2. Courier &amp; Tracking Details
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
                      placeholder="TCS Tracking ID (e.g. TCS-104290)"
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
                    Save Courier Tracking
                  </button>
                </form>

                {/* Action 3: Payment Verification */}
                <form
                  onSubmit={handleUpdatePayment}
                  className="border border-[#E2E8F0] p-4 space-y-3"
                >
                  <h4 className="text-[13px] font-semibold text-[#0F172A] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#15472B]" />
                    <span>3. Payment &amp; IBFT Verification</span>
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

                {/* Action 4: Cancel Order & Restore Inventory */}
                {selectedOrder.orderStatus !== 'delivered' &&
                  selectedOrder.orderStatus !== 'cancelled' && (
                    <div className="border border-[#FECACA] bg-[#FEF2F2]/60 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[13px] font-semibold text-[#991B1B] flex items-center gap-2">
                          <AlertOctagon className="w-4 h-4" />
                          <span>Cancel Order &amp; Restore Stock</span>
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
                            placeholder="Reason (e.g. Customer requested cancellation via phone)"
                            className="w-full border border-[#FCA5A5] bg-white px-3 py-2 text-[13px]"
                          />
                          <button
                            type="submit"
                            disabled={actionBusy}
                            className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.07em] cursor-pointer"
                          >
                            Confirm Cancellation &amp; Restock
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                {/* Status Audit History */}
                <div className="border border-[#E2E8F0] p-4 space-y-3">
                  <h4 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#334155]">
                    Status History
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
