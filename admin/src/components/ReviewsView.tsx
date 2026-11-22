import React, { useEffect, useState, useMemo } from 'react';
import {
  Star,
  Trash2,
  RefreshCw,
  Check,
  EyeOff,
  Search,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
  Filter,
  User,
} from 'lucide-react';
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
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [search, setSearch] = useState('');
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

  // Top 4 KPI Metrics & Star Distribution
  const metrics = useMemo(() => {
    const totalCount = reviews.length;
    let approvedCount = 0;
    let sumRating = 0;
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((r) => {
      if (r.isApproved) approvedCount += 1;
      const rNum = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      distribution[rNum] = (distribution[rNum] || 0) + 1;
      sumRating += r.rating || 5;
    });

    const avgRating = totalCount > 0 ? (sumRating / totalCount).toFixed(1) : '5.0';
    const pendingCount = totalCount - approvedCount;

    return {
      totalCount,
      approvedCount,
      pendingCount,
      avgRating,
      distribution,
    };
  }, [reviews]);

  // Filtered Reviews
  const visibleReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (filter === 'approved' && !r.isApproved) return false;
      if (filter === 'hidden' && r.isApproved) return false;
      if (ratingFilter !== null && Math.round(r.rating) !== ratingFilter) return false;

      if (q) {
        const matchesAuthor = (r.author || '').toLowerCase().includes(q);
        const matchesEmail = (r.email || '').toLowerCase().includes(q);
        const matchesComment = (r.comment || '').toLowerCase().includes(q);
        const matchesRef = (r.orderReference || '').toLowerCase().includes(q);
        return matchesAuthor || matchesEmail || matchesComment || matchesRef;
      }
      return true;
    });
  }, [reviews, filter, ratingFilter, search]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-[25px] font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <Star className="w-6 h-6 text-[#F59E0B] fill-[#F59E0B]" />
            Customer Reviews &amp; Moderation Console
          </h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Inspect verified customer harvest reviews, curate storefront testimonials, and monitor satisfaction ratings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search author, email, comment..."
              className="w-[210px] sm:w-[260px] border border-[#CBD5E1] bg-white rounded-xl pl-3.5 pr-9 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B] transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => void loadReviews()}
            aria-label="Refresh reviews"
            title="Refresh Reviews"
            className="border border-[#E5E9E4] bg-white hover:border-[#0F172A] p-2 rounded-xl text-[#334155] cursor-pointer shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#15472B]' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-[#FECACA] bg-[#FEF2F2] rounded-2xl px-4 py-3 text-[13px] text-[#B91C1C] flex items-center gap-2 shadow-2xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626]" />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Average Rating */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#FBBF24]">
              <Star className="w-5 h-5 fill-[#FBBF24]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Storefront Rating</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Average customer score</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none flex items-baseline gap-1.5">
              <span>{metrics.avgRating}</span>
              <span className="text-[14px] text-[#94A3B8] font-normal">/ 5.0</span>
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">★</span>
              <span>Across all submitted reviews</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,58 C30,52 50,30 80,45 C110,60 125,25 140,32 L140,65 L0,65 Z"
                fill="url(#waveRev1)"
              />
              <defs>
                <linearGradient id="waveRev1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2: Total Reviews */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Total Reviews</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Database records</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {metrics.totalCount}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">●</span>
              <span>Buyer testimonials recorded</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M30,62 C60,48 85,22 115,38 C128,45 136,25 140,20 L140,65 L30,65 Z"
                fill="url(#waveRev2)"
              />
              <defs>
                <linearGradient id="waveRev2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 3: Approved & Live */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Approved Live</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Published on product pages</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {metrics.approvedCount}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">✓</span>
              <span>Visible to website visitors</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M10,65 C40,40 70,60 100,30 C120,45 130,20 140,25 L140,65 Z"
                fill="url(#waveRev3)"
              />
              <defs>
                <linearGradient id="waveRev3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BBF7D0" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.08" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 4: Pending / Hidden */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Pending Review</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Awaiting moderation</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {metrics.pendingCount}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className={metrics.pendingCount > 0 ? 'text-[#D97706] font-bold' : 'text-[#16A34A] font-bold'}>
                {metrics.pendingCount > 0 ? '●' : '✓'}
              </span>
              <span>{metrics.pendingCount > 0 ? 'Requires attention' : 'All reviews reviewed'}</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,60 C40,55 60,35 90,45 C120,55 130,28 140,35 L140,65 Z"
                fill="url(#waveRev4)"
              />
              <defs>
                <linearGradient id="waveRev4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Star Breakdown & Quick Sentiment Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 border-r border-[#E2E8F0]">
              <span className="text-[28px] font-bold text-[#0F172A] font-mono-data leading-none">
                {metrics.avgRating}
              </span>
              <div className="flex items-center justify-center gap-0.5 text-[#F59E0B] mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-[#F59E0B]" />
                ))}
              </div>
              <span className="text-[11px] text-[#64748B] mt-0.5 block font-mono-data">
                {metrics.totalCount} ratings
              </span>
            </div>

            {/* Distribution Bars */}
            <div className="flex-1 space-y-1.5 min-w-[220px]">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = metrics.distribution[stars] || 0;
                const pct = metrics.totalCount > 0 ? (count / metrics.totalCount) * 100 : 0;
                const isSelected = ratingFilter === stars;
                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setRatingFilter(isSelected ? null : stars)}
                    className={`w-full flex items-center gap-2.5 text-[11.5px] cursor-pointer rounded-lg px-2 py-0.5 transition-colors ${
                      isSelected ? 'bg-[#F4F9F5] font-bold text-[#15472B]' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="w-5 text-right font-mono-data">{stars}★</span>
                    <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F59E0B] rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono-data text-[#64748B]">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <span className="text-[12px] font-semibold text-[#64748B] mr-1">Filter:</span>
            {(['all', 'approved', 'hidden'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize cursor-pointer transition-colors ${
                  filter === st
                    ? 'bg-[#15472B] text-white shadow-2xs'
                    : 'bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9]'
                }`}
              >
                {st === 'all' ? 'All Reviews' : st === 'approved' ? 'Approved Only' : 'Hidden / Pending'}
              </button>
            ))}
            {ratingFilter !== null && (
              <button
                type="button"
                onClick={() => setRatingFilter(null)}
                className="text-[11px] font-semibold text-[#DC2626] underline hover:no-underline cursor-pointer ml-1"
              >
                Clear {ratingFilter}★ filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-3.5">
        {loading && reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E9E4] p-12 text-center text-[13.5px] text-[#64748B]">
            Loading customer reviews...
          </div>
        ) : visibleReviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E9E4] p-14 text-center space-y-3 shadow-2xs">
            <Star className="w-10 h-10 text-[#CBD5E1] mx-auto" />
            <p className="text-[14.5px] font-semibold text-[#0F172A]">
              No customer reviews match your filter
            </p>
            <p className="text-[12.5px] text-[#64748B] max-w-sm mx-auto">
              When shoppers review their harvests or orders, their ratings appear here for moderation.
            </p>
          </div>
        ) : (
          visibleReviews.map((review) => {
            const isBusy = busyId === review._id;
            const isConfirming = confirmDeleteId === review._id;
            const authorInitial = (review.author || 'C').charAt(0).toUpperCase();

            return (
              <div
                key={review._id}
                className="bg-white rounded-2xl border border-[#E5E9E4] p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row sm:items-start justify-between gap-5"
              >
                {/* Review Left Side */}
                <div className="space-y-3 flex-1 min-w-0">
                  {/* Author Header */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0F3520] text-[#4ADE80] font-bold text-[12.5px] flex items-center justify-center shrink-0 shadow-inner">
                      {authorInitial}
                    </div>

                    <span className="font-semibold text-[14px] text-[#0F172A]">
                      {review.author}
                    </span>

                    {review.email && (
                      <span className="text-[12px] text-[#2563EB] font-mono-data">
                        ({review.email})
                      </span>
                    )}

                    {review.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#86EFAC]">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>Verified Buyer</span>
                      </span>
                    )}

                    {review.orderReference && (
                      <span className="text-[11.5px] text-[#64748B] font-mono-data bg-[#F1F5F9] px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                        Ref: {review.orderReference}
                      </span>
                    )}

                    <span className="text-[11.5px] text-[#94A3B8] font-mono-data ml-auto sm:ml-0">
                      {formatDateTime(review.createdAt)}
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 text-[#F59E0B]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= review.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#CBD5E1]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[12.5px] font-bold text-[#0F172A] font-mono-data ml-1">
                      {review.rating}/5.0
                    </span>
                  </div>

                  {/* Comment Bubble */}
                  <div className="bg-[#FAF8F5] border border-[#E8E4DB] rounded-xl p-3.5 text-[13px] text-[#334155] leading-relaxed whitespace-pre-wrap">
                    {review.comment}
                  </div>
                </div>

                {/* Right Side: Status Badge & Actions */}
                <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 pt-1">
                  {/* Status Indicator */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                      review.isApproved
                        ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'
                        : 'bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        review.isApproved ? 'bg-[#16A34A]' : 'bg-[#64748B]'
                      }`}
                    />
                    <span>{review.isApproved ? 'Approved & Live' : 'Hidden / Unapproved'}</span>
                  </span>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleToggleApproval(review)}
                      className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs ${
                        review.isApproved
                          ? 'border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#334155]'
                          : 'bg-[#15472B] hover:bg-[#0F3620] text-white'
                      }`}
                    >
                      {review.isApproved ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
                          <span>Approve</span>
                        </>
                      )}
                    </button>

                    {isConfirming ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleDelete(review._id)}
                          className="bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white px-2.5 py-1.5 text-[11.5px] font-semibold rounded-xl cursor-pointer shadow-2xs"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="border border-[#CBD5E1] px-2 py-1.5 text-[11.5px] text-[#475569] rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(review._id)}
                        aria-label="Delete review"
                        title="Delete Review"
                        className="p-2 border border-[#FECACA] hover:bg-[#FEF2F2] rounded-xl text-[#DC2626] cursor-pointer transition-colors shadow-2xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReviewsView;
