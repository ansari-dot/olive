import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, MessageSquare } from 'lucide-react';
import { fetchAdminInquiries, updateAdminInquiry } from '../services/adminApi';
import type { AdminInquiry, InquiryStatus } from '../types/admin';
import { INQUIRY_STATUS_META, formatDateTime } from '../utils/formatters';

export const InquiriesView: React.FC = () => {
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('all');
  const [topicFilter, setTopicFilter] = useState('all');

  // Active editor state per inquiry
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<InquiryStatus>('in_progress');
  const [editNote, setEditNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadInquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAdminInquiries();
      setInquiries(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load care inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInquiries();
  }, []);

  const openEditor = (inq: AdminInquiry) => {
    if (selectedId === inq._id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(inq._id);
    setEditStatus(inq.status);
    setEditNote(inq.adminNote || '');
    setNotice(null);
  };

  const handleSave = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await updateAdminInquiry(id, {
        status: editStatus,
        adminNote: editNote.trim(),
      });
      setInquiries((prev) => prev.map((item) => (item._id === id ? { ...item, ...updated } : item)));
      setNotice('Care inquiry status and internal note saved.');
      setSelectedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update inquiry.');
    } finally {
      setSaving(false);
    }
  };

  const topics = Array.from(new Set(inquiries.map((i) => i.topic).filter(Boolean)));

  const filtered = inquiries.filter((inq) => {
    if (statusFilter !== 'all' && inq.status !== statusFilter) return false;
    if (topicFilter !== 'all' && inq.topic !== topicFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-[#0F172A]">
            Islamabad Care Desk Inquiries
          </h2>
          <p className="text-[13px] text-[#64748B] font-mono-data">
            {inquiries.length} inquiries · {inquiries.filter((i) => i.status === 'new').length} unread
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | InquiryStatus)}
            aria-label="Filter by inquiry status"
            className="border border-[#CBD5E1] bg-white px-3 py-2 text-[12.5px] text-[#0F172A]"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            aria-label="Filter by topic"
            className="border border-[#CBD5E1] bg-white px-3 py-2 text-[12.5px] text-[#0F172A]"
          >
            <option value="all">All Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void loadInquiries()}
            aria-label="Refresh inquiries"
            className="border border-[#CBD5E1] bg-white hover:border-[#0F172A] p-2 text-[#334155] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {notice && (
        <div className="border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-2.5 text-[13px] text-[#15803D] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading && inquiries.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] p-8 text-center text-[13.5px] text-[#64748B]">
            Loading inquiries...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] p-12 text-center text-[14px] text-[#64748B]">
            No contact inquiries match the selected filters.
          </div>
        ) : (
          filtered.map((inq) => {
            const stMeta = INQUIRY_STATUS_META[inq.status] ?? {
              label: inq.status,
              colorClass: 'text-[#334155]',
            };
            const isExpanded = selectedId === inq._id;

            return (
              <div key={inq._id} className="bg-white border border-[#E2E8F0] p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-[15px] text-[#0F172A]">{inq.name}</span>
                      <span className="text-[12.5px] font-mono-data text-[#475569]">
                        {inq.contactInfo}
                      </span>
                      <span className="text-[12.5px] text-[#64748B]">· {inq.city}</span>
                      <span className={`text-[12px] font-semibold ${stMeta.colorClass}`}>
                        · {stMeta.label}
                      </span>
                    </div>

                    <p className="text-[12px] uppercase tracking-[0.06em] font-semibold text-[#15472B]">
                      {inq.topic}
                    </p>
                    <p className="text-[13.5px] text-[#334155] leading-relaxed max-w-[780px]">
                      {inq.message}
                    </p>

                    {inq.adminNote && !isExpanded && (
                      <p className="text-[12.5px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 mt-2">
                        <span className="font-semibold text-[#0F172A]">Care Note:</span>{' '}
                        {inq.adminNote}
                      </p>
                    )}
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                    <span className="font-mono-data text-[11.5px] text-[#64748B]">
                      {formatDateTime(inq.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditor(inq)}
                      className="border border-[#CBD5E1] hover:border-[#15472B] px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#0F172A] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Close' : 'Update Status'}</span>
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <form
                    onSubmit={(e) => void handleSave(e, inq._id)}
                    className="mt-4 pt-4 border-t border-[#E2E8F0] grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-3 items-end"
                  >
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[#475569] mb-1">
                        Resolution Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as InquiryStatus)}
                        className="w-full border border-[#CBD5E1] bg-white px-3 py-2 text-[13px]"
                      >
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[#475569] mb-1">
                        Internal Care Team Note
                      </label>
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Called customer on WhatsApp, dispatched sample / quote..."
                        className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-[#15472B] hover:bg-[#0F3620] disabled:opacity-60 text-white px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.07em] cursor-pointer"
                    >
                      {saving ? 'Saving...' : 'Save Update'}
                    </button>
                  </form>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
