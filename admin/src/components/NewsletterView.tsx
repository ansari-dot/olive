import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, Search } from 'lucide-react';
import {
  downloadNewsletterCsv,
  fetchAdminNewsletter,
} from '../services/adminApi';
import type { NewsletterSubscriber } from '../types/admin';
import { formatDateTime } from '../utils/formatters';

export const NewsletterView: React.FC = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadSubscribers = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAdminNewsletter();
      setSubscribers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load newsletter subscribers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSubscribers();
  }, []);

  const handleExportCsv = async () => {
    setExporting(true);
    setError(null);
    try {
      await downloadNewsletterCsv();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export subscribers CSV.');
    } finally {
      setExporting(false);
    }
  };

  const filtered = subscribers.filter((sub) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      sub.email.toLowerCase().includes(q) ||
      (sub.source || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-[#0F172A]">
            Harvest Letter Subscribers
          </h2>
          <p className="text-[13px] text-[#64748B] font-mono-data">
            {subscribers.length} subscribers ·{' '}
            {subscribers.filter((s) => s.isActive).length} active
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email..."
              className="w-[220px] border border-[#CBD5E1] bg-white pl-3.5 pr-9 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
            />
            <Search className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => void loadSubscribers()}
            aria-label="Refresh subscribers"
            className="border border-[#CBD5E1] bg-white hover:border-[#0F172A] p-2 text-[#334155] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            disabled={exporting || subscribers.length === 0}
            onClick={() => void handleExportCsv()}
            className="inline-flex items-center gap-2 bg-[#15472B] hover:bg-[#0F3620] disabled:opacity-50 text-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
          {error}
        </div>
      )}

      <div className="bg-white border border-[#E2E8F0] overflow-x-auto">
        {loading && subscribers.length === 0 ? (
          <div className="p-8 text-center text-[13.5px] text-[#64748B]">
            Loading Harvest Letter subscribers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[14px] text-[#64748B]">
            No newsletter subscribers found.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-3 px-4 text-left font-semibold">Email Address</th>
                <th className="py-3 px-4 text-left font-semibold">Source</th>
                <th className="py-3 px-4 text-left font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Subscribed On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.map((sub) => (
                <tr key={sub._id} className="hover:bg-[#F8FAFC] h-[44px]">
                  <td className="px-4 font-mono-data text-[#0F172A]">{sub.email}</td>
                  <td className="px-4 text-[#475569]">{sub.source || 'Harvest Letter'}</td>
                  <td className="px-4">
                    <span
                      className={`font-medium ${
                        sub.isActive ? 'text-[#16A34A]' : 'text-[#64748B]'
                      }`}
                    >
                      {sub.isActive ? 'Subscribed' : 'Unsubscribed'}
                    </span>
                  </td>
                  <td className="px-4 text-right font-mono-data text-[12px] text-[#64748B]">
                    {formatDateTime(sub.subscribedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
