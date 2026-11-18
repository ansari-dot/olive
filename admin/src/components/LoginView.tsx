import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { getApiBaseUrl, loginAdmin } from '../services/adminApi';
import type { AdminUser } from '../types/admin';

interface LoginViewProps {
  onSuccess: (admin: AdminUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('admin@zaitoonpakistan.pk');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const { admin } = await loginAdmin(email.trim(), password);
      onSuccess(admin);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Verify your backend server is running and credentials are valid.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px] bg-white border border-[#E2E8F0] p-8 sm:p-10">
        <div className="pb-6 mb-7 border-b border-[#E2E8F0]">
          <p className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#C46B3B]">
            Islamabad Orchard Hub
          </p>
          <h1 className="mt-1.5 font-serif-brand text-[28px] font-semibold text-[#15472B] tracking-tight">
            Zaitoon Pakistan
          </h1>
          <p className="mt-1 text-[13.5px] text-[#475569]">
            Sign in to the Operations &amp; Dispatch Admin Console.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#334155] mb-1.5"
            >
              Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@zaitoonpakistan.pk"
              className="w-full border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] focus:outline-none focus:border-[#15472B]"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#334155] mb-1.5"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter administrator password"
              className="w-full border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] focus:outline-none focus:border-[#15472B]"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-[13px] text-[#B91C1C]"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#15472B] hover:bg-[#0F3620] disabled:opacity-60 text-white py-3 px-5 text-[12px] font-semibold uppercase tracking-[0.09em] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{loading ? 'Signing In...' : 'Sign In to Console'}</span>
            {!loading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        <div className="mt-7 pt-5 border-t border-[#F1F5F9] text-[12px] text-[#64748B] space-y-1">
          <p>
            API Endpoint:{' '}
            <span className="font-mono-data text-[#334155] break-all">{getApiBaseUrl()}</span>
          </p>
          <p>Seeded super admin: admin@zaitoonpakistan.pk</p>
        </div>
      </div>
    </div>
  );
};
