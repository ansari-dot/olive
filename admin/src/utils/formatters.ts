import type { InquiryStatus, OrderStatus, PaymentStatus } from '../types/admin';

export const formatPKR = (amount: number | undefined | null): string =>
  `Rs. ${Number(amount ?? 0).toLocaleString('en-PK')}`;

export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; colorClass: string; stage: number }
> = {
  confirmed: {
    label: 'Confirmed',
    colorClass: 'text-[#1D4ED8]',
    stage: 1,
  },
  cold_packed: {
    label: 'Cold-Packed',
    colorClass: 'text-[#D97706]',
    stage: 2,
  },
  dispatched: {
    label: 'Dispatched',
    colorClass: 'text-[#0F766E]',
    stage: 3,
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    colorClass: 'text-[#047857]',
    stage: 4,
  },
  delivered: {
    label: 'Delivered',
    colorClass: 'text-[#16A34A]',
    stage: 4,
  },
  cancelled: {
    label: 'Cancelled',
    colorClass: 'text-[#DC2626]',
    stage: 0,
  },
  returned: {
    label: 'Returned',
    colorClass: 'text-[#9333EA]',
    stage: 0,
  },
};

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; colorClass: string }
> = {
  pending_cod: { label: 'Pending COD', colorClass: 'text-[#D97706]' },
  pending_payfast: { label: 'Pending PayFast', colorClass: 'text-[#D97706]' },
  awaiting_ibft: { label: 'Awaiting IBFT', colorClass: 'text-[#C46B3B]' },
  paid: { label: 'Paid', colorClass: 'text-[#16A34A]' },
  failed: { label: 'Failed', colorClass: 'text-[#DC2626]' },
  refunded: { label: 'Refunded', colorClass: 'text-[#64748B]' },
};

export const INQUIRY_STATUS_META: Record<
  InquiryStatus,
  { label: string; colorClass: string }
> = {
  new: { label: 'New', colorClass: 'text-[#C46B3B]' },
  in_progress: { label: 'In Progress', colorClass: 'text-[#D97706]' },
  resolved: { label: 'Resolved', colorClass: 'text-[#16A34A]' },
};
