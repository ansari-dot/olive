import React, { useEffect, useMemo, useState } from 'react';
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
  Trash2,
  MapPin,
  Phone,
  Clock,
  ChevronRight,
  DollarSign,
  ArrowUpRight,
  Filter,
  Check,
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
  deleteAllAdminOrders,
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

  // KPI Metrics derived from current orders
  const kpiData = useMemo(() => {
    let pendingCount = 0;
    let inTransitCount = 0;
    let volume = 0;

    orders.forEach((o) => {
      if (o.orderStatus === 'confirmed' || o.orderStatus === 'cold_packed') {
        pendingCount += 1;
      } else if (o.orderStatus === 'dispatched' || o.orderStatus === 'out_for_delivery') {
        inTransitCount += 1;
      }
      if (o.orderStatus !== 'cancelled') {
        volume += o.total || 0;
      }
    });

    return {
      pendingCount,
      inTransitCount,
      volume,
    };
  }, [orders]);

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

  const handleDeleteAllOrders = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete ALL orders in the system? This action is permanent and cannot be undone.'
      )
    ) {
      return;
    }

    setActionBusy(true);
    try {
      const res = await deleteAllAdminOrders();
      setSelectedOrder(null);
      setActionNotice(res.message || 'All orders deleted successfully.');
      await loadOrders(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete orders.');
    } finally {
      setActionBusy(false);
    }
  };

  // Helper for status badge classes matching Dashboard styling
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'cold_packed':
        return {
          label: 'Cold-Packed',
          badgeClass: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]',
        };
      case 'confirmed':
        return {
          label: 'Confirmed',
          badgeClass: 'bg-[#EAF3EC] text-[#15472B] border border-[#D5E6D8]',
        };
      case 'dispatched':
        return {
          label: 'Dispatched',
          badgeClass: 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]',
        };
      case 'out_for_delivery':
        return {
          label: 'Out for Delivery',
          badgeClass: 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]',
        };
      case 'delivered':
        return {
          label: 'Delivered',
          badgeClass: 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          badgeClass: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]',
        };
      case 'returned':
        return {
          label: 'Returned',
          badgeClass: 'bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]',
        };
      default:
        return {
          label: status,
          badgeClass: 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]',
        };
    }
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    paymentStatusFilter !== 'all' ||
    courierProviderFilter !== 'all' ||
    shipmentStatusFilter !== 'all' ||
    cityFilter !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    Boolean(search.trim());

  const resetAllFilters = () => {
    setStatusFilter('all');
    setPaymentFilter('all');
    setPaymentStatusFilter('all');
    setCourierProviderFilter('all');
    setShipmentStatusFilter('all');
    setCityFilter('all');
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Search Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-[25px] font-bold text-[#0F172A] tracking-tight">
            Orders &amp; Dispatch Console
          </h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Live order processing, multi-courier booking, tracking sync, and atomic inventory protection.
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
              placeholder="Search ZP-XXXX, tracking, phone..."
              className="w-[230px] sm:w-[280px] border border-[#CBD5E1] bg-white rounded-xl pl-3.5 pr-9 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B] transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="submit"
            className="bg-[#0E291C] hover:bg-[#15472B] text-white px-4 py-2 rounded-xl text-[12.5px] font-semibold tracking-wide cursor-pointer transition-colors shadow-2xs"
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => void loadOrders(page)}
            aria-label="Refresh orders"
            title="Refresh Orders"
            className="border border-[#E5E9E4] bg-white hover:border-[#0F172A] p-2 rounded-xl text-[#334155] cursor-pointer shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#15472B]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleDeleteAllOrders}
            disabled={actionBusy}
            title="Delete All Orders"
            className="border border-[#FCA5A5] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-[12px] font-semibold shadow-2xs"
          >
            <Trash2 className="w-4 h-4 text-[#DC2626]" />
            <span className="hidden sm:inline">Delete All</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="border border-[#FECACA] bg-[#FEF2F2] rounded-2xl px-4 py-3 text-[13px] text-[#B91C1C] flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0 text-[#DC2626]" />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: Top 4 KPI Metric Cards (Identical layout language to Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Orders */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Total Orders</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">(Database records)</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {total}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">↑</span>
              <span>{orders.length} showing on page {page}</span>
            </p>
          </div>

          {/* Decorative Wave SVG */}
          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,58 C30,52 50,30 80,45 C110,60 125,25 140,32 L140,65 L0,65 Z"
                fill="url(#waveOrders1)"
              />
              <path
                d="M30,62 C60,48 85,22 115,38 C128,45 136,25 140,20 L140,65 L30,65 Z"
                fill="url(#waveOrders1b)"
              />
              <defs>
                <linearGradient id="waveOrders1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="waveOrders1b" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BBF7D0" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.08" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2: Pending Dispatch */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Pending Dispatch</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">(Stage 1–2 Packed)</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {kpiData.pendingCount}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1">
              <span>Open dispatch queue</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#16A34A]" />
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,60 C25,50 55,28 85,42 C115,56 128,24 140,30 L140,65 L0,65 Z"
                fill="url(#waveOrders2)"
              />
              <path
                d="M25,64 C55,46 80,20 110,36 C124,44 135,26 140,22 L140,65 L25,65 Z"
                fill="url(#waveOrders2b)"
              />
              <defs>
                <linearGradient id="waveOrders2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.04" />
                </linearGradient>
                <linearGradient id="waveOrders2b" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BBF7D0" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.07" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 3: Active Consignments */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Active Consignments</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">(Stage 3–4 In-Transit)</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {kpiData.inTransitCount}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data">
              TCS • Leopards • Trax • M&amp;P
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,56 C30,48 60,32 90,44 C115,54 130,22 140,28 L140,65 L0,65 Z"
                fill="url(#waveOrders3)"
              />
              <path
                d="M20,62 C50,44 75,18 105,34 C120,42 132,24 140,18 L140,65 L20,65 Z"
                fill="url(#waveOrders3b)"
              />
              <defs>
                <linearGradient id="waveOrders3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.04" />
                </linearGradient>
                <linearGradient id="waveOrders3b" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BBF7D0" stopOpacity="0.40" />
                  <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.06" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 4: Filtered Volume */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Batch Volume</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">(Non-Cancelled)</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {formatPKR(kpiData.volume)}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data">
              Nationwide COD &amp; IBFT
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,62 C35,50 65,30 95,45 C120,55 132,25 140,30 L140,65 L0,65 Z"
                fill="url(#waveOrders4)"
              />
              <path
                d="M20,65 C55,48 80,22 110,38 C125,46 135,28 140,22 L140,65 L20,65 Z"
                fill="url(#waveOrders4b)"
              />
              <defs>
                <linearGradient id="waveOrders4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FED7AA" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#F97316" stopOpacity="0.06" />
                </linearGradient>
                <linearGradient id="waveOrders4b" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFEDD5" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#FDBA74" stopOpacity="0.10" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Row 2: Advanced Filter Controls Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0E291C] mr-1">
          <Filter className="w-3.5 h-3.5 text-[#15472B]" />
          <span>Filters:</span>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-1.5 text-[12px] text-[#475569] bg-[#F8FAF7] border border-[#E5E9E4] px-2.5 py-1.5 rounded-xl">
          <Calendar className="w-3.5 h-3.5 text-[#15472B]" />
          <span className="text-[11.5px] font-medium text-[#64748B]">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-[12px] text-[#0F172A] focus:outline-none"
          />
          <span className="text-[11.5px] font-medium text-[#64748B]">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-[12px] text-[#0F172A] focus:outline-none"
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-[11px] text-[#C46B3B] hover:underline cursor-pointer ml-1 font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by order status"
          className="border border-[#E5E9E4] bg-[#F8FAF7] hover:bg-white px-3 py-1.5 rounded-xl text-[12.5px] text-[#0F172A] focus:outline-none focus:border-[#15472B] transition-colors cursor-pointer"
        >
          <option value="all">All Order Stages</option>
          <option value="confirmed">Confirmed (Stage 1)</option>
          <option value="cold_packed">Cold-Packed (Stage 2)</option>
          <option value="dispatched">Dispatched (Stage 3)</option>
          <option value="out_for_delivery">Out for Delivery (Stage 4)</option>
          <option value="delivered">Delivered (Stage 5)</option>
          <option value="returned">Returned (Stage 0)</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Courier Provider Filter */}
        <select
          value={courierProviderFilter}
          onChange={(e) => setCourierProviderFilter(e.target.value)}
          aria-label="Filter by courier provider"
          className="border border-[#E5E9E4] bg-[#F8FAF7] hover:bg-white px-3 py-1.5 rounded-xl text-[12.5px] text-[#0F172A] focus:outline-none focus:border-[#15472B] transition-colors cursor-pointer"
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
          className="border border-[#E5E9E4] bg-[#F8FAF7] hover:bg-white px-3 py-1.5 rounded-xl text-[12.5px] text-[#0F172A] focus:outline-none focus:border-[#15472B] transition-colors cursor-pointer"
        >
          <option value="all">All Payment Methods</option>
          <option value="Cash on Delivery">Cash on Delivery</option>
          <option value="PayFast (Sandbox)">PayFast (Sandbox)</option>
          <option value="Bank Transfer (IBFT)">Bank Transfer (IBFT)</option>
        </select>

        {/* Payment Status Filter */}
        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          aria-label="Filter by payment status"
          className="border border-[#E5E9E4] bg-[#F8FAF7] hover:bg-white px-3 py-1.5 rounded-xl text-[12.5px] text-[#0F172A] focus:outline-none focus:border-[#15472B] transition-colors cursor-pointer"
        >
          <option value="all">All Payment States</option>
          <option value="pending_cod">Pending COD</option>
          <option value="pending_payfast">Pending PayFast</option>
          <option value="awaiting_ibft">Awaiting IBFT</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        {/* City Filter */}
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          aria-label="Filter by city"
          className="border border-[#E5E9E4] bg-[#F8FAF7] hover:bg-white px-3 py-1.5 rounded-xl text-[12.5px] text-[#0F172A] focus:outline-none focus:border-[#15472B] transition-colors cursor-pointer"
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

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-[12px] font-semibold text-[#15472B] hover:underline cursor-pointer ml-auto"
          >
            Reset All Filters
          </button>
        )}
      </div>

      {/* Row 3: Orders Master Table */}
      <div className="bg-white rounded-2xl border border-[#E5E9E4] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="p-12 text-center text-[13.5px] text-[#64748B]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#15472B] mb-2" />
            <span>Loading orders and courier consignments...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-14 text-center text-[14px] text-[#64748B]">
            No orders match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-[#64748B] bg-[#F8FAF7] border-b border-[#E5E9E4]">
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
                  const badge = getStatusBadge(ord.orderStatus);
                  const payMeta = PAYMENT_STATUS_META[ord.paymentStatus];
                  const trackingNumber =
                    ord.shipment?.trackingNumber || ord.courierTrackingCode;
                  const trackingUrl = ord.shipment?.trackingUrl;
                  const isRestocked =
                    ord.inventoryState === 'restored' ||
                    ord.returnDetails?.status === 'restocked';

                  return (
                    <tr
                      key={ord._id}
                      className="hover:bg-[#F9FAF8] transition-colors"
                    >
                      {/* 1. Order Ref */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono-data font-bold text-[#15472B] text-[13.5px]">
                          {ord.orderReference}
                        </span>
                        <p className="text-[11.5px] text-[#64748B] font-mono-data mt-0.5">
                          {formatDateTime(ord.createdAt)}
                        </p>
                        {ord.returnDetails?.status && ord.returnDetails.status !== 'none' && (
                          <span className="inline-block mt-1 bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF] px-2 py-0.5 text-[10px] uppercase font-bold rounded-full">
                            Return: {ord.returnDetails.status}
                          </span>
                        )}
                      </td>

                      {/* 2. Customer */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#0F172A]">{ord.customer?.name}</p>
                        <p className="text-[12px] text-[#64748B] font-mono-data mt-0.5">
                          {ord.customer?.phone}
                        </p>
                      </td>

                      {/* 3. Destination & Courier */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-[#0F172A] font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#15472B] shrink-0" />
                          <span>{ord.shippingAddress?.city}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] font-medium bg-[#F1F5F9] text-[#334155] px-2 py-0.5 rounded-md">
                            {ord.courierName || 'Pending Courier'}
                          </span>
                          {trackingNumber && (
                            trackingUrl ? (
                              <a
                                href={trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-[#15472B] hover:underline font-mono-data flex items-center gap-0.5 font-semibold"
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

                      {/* 4. Payment */}
                      <td className="py-3.5 px-4">
                        <p className="text-[#0F172A] font-medium">{ord.paymentMethod}</p>
                        <span className={`inline-block mt-0.5 text-[11px] font-medium ${payMeta?.colorClass ?? 'text-[#64748B]'}`}>
                          {payMeta?.label ?? ord.paymentStatus}
                        </span>
                      </td>

                      {/* 5. Status & Stock */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badge.badgeClass}`}>
                            {badge.label}
                          </span>
                          {isRestocked && (
                            <span className="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full">
                              Restocked
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B] font-mono-data mt-1">
                          Stage {ord.trackingStage}/4 · {ord.inventoryState || 'deducted'}
                        </p>
                      </td>

                      {/* 6. Total */}
                      <td className="py-3.5 px-4 text-right font-mono-data font-bold text-[#0F172A] text-[14px]">
                        {formatPKR(ord.total)}
                      </td>

                      {/* 7. Action Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => void openOrderDrawer(ord.orderReference)}
                          className="border border-[#E5E9E4] hover:border-[#0E291C] hover:bg-[#0E291C] hover:text-white px-3 py-1.5 rounded-lg text-[11.5px] font-semibold text-[#0F172A] transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                        >
                          Manage &amp; Dispatch &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#F8FAF7] border-t border-[#E5E9E4] text-[12.5px] text-[#475569]">
            <span className="font-mono-data">
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total orders)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => void loadOrders(page - 1)}
                className="border border-[#E5E9E4] bg-white hover:bg-[#F8FAF7] disabled:opacity-40 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-[#0F172A] transition-colors cursor-pointer shadow-2xs"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => void loadOrders(page + 1)}
                className="border border-[#E5E9E4] bg-white hover:bg-[#F8FAF7] disabled:opacity-40 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-[#0F172A] transition-colors cursor-pointer shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Order Detail & Courier Dispatch Drawer */}
      {(selectedOrder || drawerLoading) && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-[680px] bg-[#FBFDFB] h-full flex flex-col border-l border-[#E5E9E4] shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Dark Forest Green Header Masthead */}
            <div className="px-6 py-5 bg-[#0E291C] text-white flex items-center justify-between border-b border-[#1C4D32]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#4ADE80] font-semibold">
                  Order &amp; Courier Dispatch Control
                </p>
                <div className="flex items-center gap-2.5 mt-1">
                  <h3 className="text-[20px] font-bold text-white font-mono-data">
                    {selectedOrder ? selectedOrder.orderReference : 'Loading...'}
                  </h3>
                  {selectedOrder && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadge(selectedOrder.orderStatus).badgeClass}`}>
                      {getStatusBadge(selectedOrder.orderStatus).label}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order drawer"
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {drawerLoading || !selectedOrder ? (
              <div className="p-12 text-center text-[14px] text-[#64748B]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#15472B] mb-2" />
                <span>Loading order record...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {actionNotice && (
                  <div className="border border-[#A7F3D0] bg-[#ECFDF5] rounded-xl px-4 py-3 text-[13px] text-[#065F46] flex items-center gap-2.5 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
                    <span>{actionNotice}</span>
                  </div>
                )}

                {/* 1. Customer & Shipping Metadata Card */}
                <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#64748B] text-[11px] font-semibold uppercase tracking-wider">
                      <Phone className="w-3.5 h-3.5 text-[#15472B]" />
                      <span>Customer Details</span>
                    </div>
                    <p className="mt-2 font-bold text-[14.5px] text-[#0F172A]">
                      {selectedOrder.customer?.name}
                    </p>
                    <p className="font-mono-data text-[#475569] mt-0.5 text-[12.5px]">
                      {selectedOrder.customer?.phone}
                    </p>
                    {selectedOrder.customer?.email && (
                      <p className="text-[#64748B] text-[12px] mt-0.5">{selectedOrder.customer.email}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-[#64748B] text-[11px] font-semibold uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 text-[#15472B]" />
                      <span>Shipping Address</span>
                    </div>
                    <p className="mt-2 font-bold text-[14px] text-[#0F172A]">
                      {selectedOrder.shippingAddress?.city}
                      {selectedOrder.shippingAddress?.area
                        ? ` · ${selectedOrder.shippingAddress.area}`
                        : ''}
                    </p>
                    <p className="text-[#475569] text-[12.5px] mt-0.5">{selectedOrder.shippingAddress?.address}</p>
                    {selectedOrder.shippingAddress?.notes && (
                      <p className="mt-1 text-[11.5px] text-[#C46B3B] font-medium bg-[#FFF7ED] p-1.5 rounded-lg border border-[#FED7AA]">
                        Note: {selectedOrder.shippingAddress.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Items & Financial Summary Card */}
                <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                    <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#15472B]" />
                      <span>Items Ordered ({selectedOrder.items.length})</span>
                    </h4>
                    <span className="text-[11px] font-mono-data px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] font-medium">
                      Stock: {selectedOrder.inventoryState || 'deducted'}
                    </span>
                  </div>

                  <div className="divide-y divide-[#F1F5F9]">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-3 text-[13px]">
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
                              className="w-11 h-11 object-cover rounded-xl bg-[#FAF3F0] shrink-0 border border-[#E5E9E4]"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-[#0F172A] truncate">
                              {item.name}
                              {item.isDeal && (
                                <span className="ml-1.5 text-[10.5px] font-bold text-[#C2410C] bg-[#FFF7ED] px-1.5 py-0.5 rounded-full border border-[#FED7AA]">
                                  FLASH DEAL (-{item.discountPercent}%)
                                </span>
                              )}
                            </p>
                            <p className="text-[11.5px] text-[#64748B] font-mono-data mt-0.5">
                              {item.size} · {formatPKR(item.price)} × {item.quantity}
                              {item.originalPrice && item.originalPrice !== item.price && (
                                <span className="line-through ml-1 text-[#94A3B8]">
                                  {formatPKR(item.originalPrice)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono-data font-bold text-[#0F172A] shrink-0 text-[13.5px]">
                          {formatPKR(item.lineTotal ?? item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#E5E9E4] space-y-1.5 text-[13px] font-mono-data">
                    <div className="flex justify-between text-[#475569]">
                      <span>Subtotal</span>
                      <span>{formatPKR(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-[#C46B3B] font-medium">
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
                    <div className="flex justify-between pt-2 border-t border-[#F1F5F9] text-[15.5px] font-bold text-[#0F172A]">
                      <span>Total Payable</span>
                      <span className="text-[#15472B]">{formatPKR(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Section 1: Multi-Courier Consignment Booking */}
                {selectedOrder.orderStatus !== 'cancelled' &&
                  selectedOrder.orderStatus !== 'returned' && (
                    <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                        <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                          <Truck className="w-4 h-4 text-[#15472B]" />
                          <span>1. Multi-Courier Dispatch &amp; Booking</span>
                        </h4>
                        {selectedOrder.shipment?.status &&
                          selectedOrder.shipment.status !== 'unshipped' && (
                            <span className="text-[11px] font-mono-data bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full font-bold uppercase">
                              {selectedOrder.shipment.provider?.toUpperCase()} · {selectedOrder.shipment.status}
                            </span>
                          )}
                      </div>

                      {/* If already booked with tracking code, show tracking actions */}
                      {(selectedOrder.shipment?.trackingNumber || selectedOrder.courierTrackingCode) ? (
                        <div className="bg-[#F8FAF7] border border-[#E5E9E4] rounded-xl p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-[#64748B] font-semibold">
                                Active Consignment Number
                              </p>
                              <div className="flex items-center gap-2.5 mt-1">
                                <span className="font-mono-data font-bold text-[16px] text-[#15472B]">
                                  {selectedOrder.shipment?.trackingNumber || selectedOrder.courierTrackingCode}
                                </span>
                                {selectedOrder.shipment?.trackingUrl && (
                                  <a
                                    href={selectedOrder.shipment.trackingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[12px] text-[#1D4ED8] hover:underline flex items-center gap-1 font-medium"
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
                              className="border border-[#CBD5E1] hover:border-[#15472B] bg-white rounded-xl px-3.5 py-2 text-[12px] font-semibold text-[#0F172A] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${actionBusy ? 'animate-spin text-[#15472B]' : ''}`} />
                              <span>Sync Live Tracking</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E5E9E4] text-[12px]">
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

                      {/* Booking Form */}
                      <form onSubmit={handleBookCourierShipment} className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-[#64748B] mb-1 font-semibold">
                              Courier Partner
                            </label>
                            <select
                              value={bookingProvider}
                              onChange={(e) => setBookingProvider(e.target.value as any)}
                              className="w-full border border-[#CBD5E1] bg-white rounded-xl px-3 py-2 text-[12.5px] text-[#0F172A] focus:outline-none focus:border-[#15472B]"
                            >
                              {COURIER_PROVIDERS.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-[#64748B] mb-1 font-semibold">
                              Parcel Weight (KG)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={parcelWeightKg}
                              onChange={(e) => setParcelWeightKg(e.target.value)}
                              className="w-full border border-[#CBD5E1] bg-white rounded-xl px-3 py-2 text-[12.5px] font-mono-data focus:outline-none focus:border-[#15472B]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-[#64748B] mb-1 font-semibold">
                              COD Collection
                            </label>
                            <div className="border border-[#E5E9E4] bg-[#F8FAF7] rounded-xl px-3 py-2 text-[12.5px] font-mono-data font-semibold text-[#0F172A]">
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
                          placeholder="Optional courier special handling notes (e.g. Fragile glass bottle)..."
                          className="w-full border border-[#CBD5E1] bg-white rounded-xl px-3.5 py-2 text-[12.5px] focus:outline-none focus:border-[#15472B]"
                        />

                        <div className="flex items-center justify-between gap-3 pt-1">
                          <button
                            type="submit"
                            disabled={actionBusy}
                            className="bg-[#0E291C] hover:bg-[#15472B] text-white px-5 py-2.5 rounded-xl text-[12.5px] font-semibold tracking-wide cursor-pointer transition-colors shadow-2xs"
                          >
                            {selectedOrder.shipment?.trackingNumber
                              ? 'Re-book Consignment'
                              : 'Generate Courier Consignment'}
                          </button>

                          {(selectedOrder.shipment?.shipmentAttempts ?? []).length > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowAttempts((p) => !p)}
                              className="text-[12px] text-[#15472B] font-semibold hover:underline cursor-pointer"
                            >
                              {showAttempts ? 'Hide History' : 'View Booking Log'} ({selectedOrder.shipment?.shipmentAttempts?.length})
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Shipment Attempts History */}
                      {showAttempts && (
                        <div className="mt-3 border border-[#E5E9E4] bg-[#F8FAF7] rounded-xl p-3.5 space-y-2 text-[12px]">
                          <p className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
                            Consignment Audit Log
                          </p>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto">
                            {(selectedOrder.shipment?.shipmentAttempts ?? []).map((att, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 border border-[#E5E9E4] bg-white rounded-lg text-[11.5px]"
                              >
                                <div className="flex justify-between font-mono-data text-[#64748B]">
                                  <span className="font-semibold text-[#0F172A]">{att.provider?.toUpperCase()} · {att.action}</span>
                                  <span>{att.timestamp ? formatDateTime(att.timestamp) : ''}</span>
                                </div>
                                {att.error ? (
                                  <p className="text-[#DC2626] mt-1 font-medium">Error: {att.error}</p>
                                ) : (
                                  <p className="text-[#16A34A] mt-1 font-medium">Status: Success</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* 4. Section 2: Advance Dispatch Stage */}
                {selectedOrder.orderStatus !== 'cancelled' &&
                  selectedOrder.orderStatus !== 'returned' && (
                    <form
                      onSubmit={handleAdvanceStatus}
                      className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4"
                    >
                      <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#15472B]" />
                        <span>2. Advance Dispatch Stage</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          value={nextStatus}
                          onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                          className="border border-[#CBD5E1] bg-white rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                        >
                          <option value="confirmed">Stage 1 – Confirmed</option>
                          <option value="cold_packed">Stage 2 – Cold-Packed</option>
                          <option value="dispatched">Stage 3 – Dispatched</option>
                          <option value="out_for_delivery">Stage 4 – Out for Delivery</option>
                          <option value="delivered">Stage 5 – Delivered</option>
                        </select>
                        <input
                          type="text"
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="Optional hub dispatch note..."
                          className="border border-[#CBD5E1] rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={actionBusy}
                        className="bg-[#0E291C] hover:bg-[#15472B] text-white px-5 py-2.5 rounded-xl text-[12.5px] font-semibold tracking-wide cursor-pointer transition-colors shadow-2xs"
                      >
                        Update Dispatch Stage
                      </button>
                    </form>
                  )}

                {/* 5. Section 3: Manual Courier Tracking Override */}
                <form
                  onSubmit={handleUpdateTracking}
                  className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4"
                >
                  <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A]">
                    3. Courier Tracking Override
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="Courier Name (e.g. TCS Express)"
                      className="border border-[#CBD5E1] rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                    <input
                      type="text"
                      value={courierTrackingCode}
                      onChange={(e) => setCourierTrackingCode(e.target.value)}
                      placeholder="Tracking Code"
                      className="border border-[#CBD5E1] rounded-xl px-3 py-2 text-[13px] font-mono-data uppercase focus:outline-none focus:border-[#15472B]"
                    />
                  </div>
                  <input
                    type="text"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    placeholder="Estimated delivery text (e.g. 2–3 business days)"
                    className="w-full border border-[#CBD5E1] rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                  />
                  <button
                    type="submit"
                    disabled={actionBusy}
                    className="border border-[#0F172A] hover:bg-[#0F172A] hover:text-white px-4 py-2 rounded-xl text-[12px] font-semibold tracking-wide transition-colors cursor-pointer shadow-2xs"
                  >
                    Save Tracking Details
                  </button>
                </form>

                {/* 6. Section 4: Payment Verification */}
                <form
                  onSubmit={handleUpdatePayment}
                  className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4"
                >
                  <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#15472B]" />
                    <span>4. Payment &amp; IBFT Verification</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={nextPaymentStatus}
                      onChange={(e) => setNextPaymentStatus(e.target.value as PaymentStatus)}
                      className="border border-[#CBD5E1] bg-white rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    >
                      <option value="pending_cod">Pending COD</option>
                      <option value="pending_payfast">Pending PayFast</option>
                      <option value="awaiting_ibft">Awaiting IBFT</option>
                      <option value="paid">Paid / Verified</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                    <input
                      type="text"
                      value={ibftReference}
                      onChange={(e) => setIbftReference(e.target.value)}
                      placeholder="IBFT / Receipt ref number..."
                      className="border border-[#CBD5E1] rounded-xl px-3 py-2 text-[13px] font-mono-data focus:outline-none focus:border-[#15472B]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={actionBusy}
                    className="border border-[#0F172A] hover:bg-[#0F172A] hover:text-white px-4 py-2 rounded-xl text-[12px] font-semibold tracking-wide transition-colors cursor-pointer shadow-2xs"
                  >
                    Update Payment Status
                  </button>
                </form>

                {/* 7. Section 5: Return Inspection & Restocking */}
                <div className="bg-[#FAF5FF] rounded-2xl border border-[#E9D5FF] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#6B21A8] flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      <span>5. Return Management &amp; Stock Recovery</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowReturnBox((p) => !p)}
                      className="text-[12px] font-bold text-[#7E22CE] hover:underline cursor-pointer"
                    >
                      {showReturnBox ? 'Hide' : 'Manage Return'}
                    </button>
                  </div>

                  {selectedOrder.returnDetails?.status && selectedOrder.returnDetails.status !== 'none' && (
                    <div className="bg-white rounded-xl border border-[#E9D5FF] p-3.5 text-[12.5px] space-y-1">
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
                        <p className="text-[#15803D] font-bold">
                          Restocked Units: {selectedOrder.returnDetails.restockedQuantity}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {showReturnBox && (
                    <form onSubmit={handleProcessReturn} className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          value={returnAction}
                          onChange={(e) => setReturnAction(e.target.value as any)}
                          className="border border-[#D8B4FE] bg-white rounded-xl px-3 py-2 text-[12.5px] focus:outline-none"
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
                            className="border border-[#D8B4FE] bg-white rounded-xl px-3 py-2 text-[12.5px] font-mono-data focus:outline-none"
                          />
                        )}
                      </div>
                      <input
                        type="text"
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        placeholder="Inspection observations / seal verification notes..."
                        className="w-full border border-[#D8B4FE] bg-white rounded-xl px-3 py-2 text-[12.5px] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={actionBusy}
                        className="bg-[#7E22CE] hover:bg-[#6B21A8] text-white px-5 py-2.5 rounded-xl text-[12px] font-semibold tracking-wide cursor-pointer transition-colors shadow-2xs"
                      >
                        Execute Return Action
                      </button>
                    </form>
                  )}
                </div>

                {/* 8. Section 6: Cancel Order & Restore Inventory */}
                {selectedOrder.orderStatus !== 'delivered' &&
                  selectedOrder.orderStatus !== 'cancelled' && (
                    <div className="bg-[#FEF2F2] rounded-2xl border border-[#FECACA] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#991B1B] flex items-center gap-2">
                          <AlertOctagon className="w-4 h-4" />
                          <span>6. Cancel Order &amp; Restore Inventory</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowCancelBox((prev) => !prev)}
                          className="text-[12px] font-bold text-[#DC2626] hover:underline cursor-pointer"
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
                            placeholder="Reason for cancellation (e.g. Customer cancelled via call)..."
                            className="w-full border border-[#FCA5A5] bg-white rounded-xl px-3 py-2 text-[13px] focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={actionBusy}
                            className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-5 py-2.5 rounded-xl text-[12px] font-semibold tracking-wide cursor-pointer transition-colors shadow-2xs"
                          >
                            Confirm Cancellation &amp; Restore Stock
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                {/* 9. Section 7: Audit Timeline */}
                <div className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4">
                  <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#15472B]" />
                    <span>Audit Status Timeline</span>
                  </h4>
                  {(selectedOrder.statusHistory ?? []).length === 0 ? (
                    <p className="text-[12.5px] text-[#64748B]">No timeline entries logged.</p>
                  ) : (
                    <ul className="space-y-3 text-[12.5px]">
                      {selectedOrder.statusHistory.map((entry, idx) => (
                        <li
                          key={idx}
                          className="pb-3 border-b border-[#F1F5F9] last:border-b-0 last:pb-0 flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="font-semibold text-[#0F172A]">
                              Stage {entry.stage} · {entry.orderStatus}
                            </p>
                            {entry.note && <p className="text-[#475569] mt-0.5">{entry.note}</p>}
                            {entry.updatedBy && (
                              <p className="text-[11px] text-[#64748B] mt-0.5">By {entry.updatedBy}</p>
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
