import React, { useEffect, useState } from 'react';
import { Star, Trash2, RefreshCw, Check, EyeOff } from 'lucide-react';
import {
  deleteAdminReview,
  fetchAdminReviews,
  moderateAdminReview,
} from '../services/adminApi';
import type { AdminReview } from '../types/admin';
import { formatDateTime } from '../utils/formatters';

export const ReviewsView: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'approved' | 'hidden'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAdminReviews();
      setReviews(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const handleToggleApproval = async (review: AdminReview) => {
    setBusyId(review._id);
    setError(null);
    try {
      const updated = await moderateAdminReview(review._id, !review.isApproved);
      setReviews((prev) =>
        prev.map((item) => (item._id === review._id ? { ...item, ...updated } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review visibility.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await deleteAdminReview(id);
      setConfirmDeleteId(null);
      setReviews((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review.');
    } finally {
      setBusyId(null);
    }
  };

  const visibleReviews = reviews.filter((r) => {
    if (filter === 'approved') return r.isApproved;
    if (filter === 'hidden') return !r.isApproved;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-[#0F172A]">
            Customer Reviews Moderation
          </h2>
          <p className="text-[13px] text-[#64748B] font-mono-data">
            {reviews.length} total reviews · {reviews.filter((r) => r.isApproved).length} approved
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'approved' | 'hidden')}
            aria-label="Filter reviews by status"
            className="border border-[#CBD5E1] bg-white px-3 py-2 text-[12.5px] text-[#0F172A]"
          >
            <option value="all">All Reviews</option>
            <option value="approved">Approved Only</option>
            <option value="hidden">Hidden / Unapproved</option>
          </select>
          <button
            type="button"
            onClick={() => void loadReviews()}
            aria-label="Refresh reviews"
            className="border border-[#CBD5E1] bg-white hover:border-[#0F172A] p-2 text-[#334155] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
          {error}
        </div>
      )}

      <div className="bg-white border border-[#E2E8F0] overflow-x-auto">
        {loading && reviews.length === 0 ? (
          <div className="p-8 text-center text-[13.5px] text-[#64748B]">Loading reviews...</div>
        ) : visibleReviews.length === 0 ? (
          <div className="p-12 text-center text-[14px] text-[#64748B]">
            No customer reviews match the selected filter.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-3 px-4 text-left font-semibold">Customer &amp; Date</th>
                <th className="py-3 px-4 text-left font-semibold">Product</th>
                <th className="py-3 px-4 text-left font-semibold">Order / Verification</th>
                <th className="py-3 px-4 text-left font-semibold">Rating</th>
                <th className="py-3 px-4 text-left font-semibold">Review Comment</th>
                <th className="py-3 px-4 text-left font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {visibleReviews.map((review) => {
                const productName =
                  typeof review.product === 'object' && review.product
                    ? review.product.name
                    : 'Pak Veda Product';
                return (
                  <tr key={review._id} className="hover:bg-[#F8FAFC] align-top">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-[#0F172A]">{review.author}</p>
                      {review.email && (
                        <p className="text-[11.5px] text-[#2563EB] font-mono-data">
                          {review.email}
                        </p>
                      )}
                      <p className="text-[11px] text-[#64748B] font-mono-data mt-0.5">
                        {formatDateTime(review.createdAt)}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-[#334155] max-w-[200px]">
                      <p className="truncate font-medium">{productName}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {review.verifiedPurchase ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Verified Buyer</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10.5px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                            Unverified
                          </span>
                        )}
                        {review.orderReference && (
                          <p className="text-[11px] font-mono-data text-[#475569]">
                            Ref: {review.orderReference}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-0.5 text-[#D97706]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= review.rating ? 'fill-[#D97706]' : 'text-[#CBD5E1]'
                            }`}
                          />
                        ))}
                        <span className="ml-1.5 font-mono-data text-[12px] text-[#0F172A]">
                          {review.rating}/5
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#475569] max-w-[360px]">
                      <p className="leading-relaxed">{review.comment}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          review.isApproved ? 'text-[#16A34A]' : 'text-[#D97706]'
                        }`}
                      >
                        {review.isApproved ? 'Approved' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyId === review._id}
                          onClick={() => void handleToggleApproval(review)}
                          className="border border-[#CBD5E1] hover:border-[#0F172A] px-2.5 py-1.5 text-[11.5px] font-medium text-[#0F172A] inline-flex items-center gap-1 cursor-pointer"
                        >
                          {review.isApproved ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hide</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                              <span>Approve</span>
                            </>
                          )}
                        </button>

                        {confirmDeleteId === review._id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={busyId === review._id}
                              onClick={() => void handleDelete(review._id)}
                              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="border border-[#CBD5E1] px-2 py-1.5 text-[11px] text-[#475569] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(review._id)}
                            aria-label="Delete review"
                            className="border border-[#FECACA] hover:bg-[#FEF2F2] text-[#DC2626] p-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
