import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { loginAdmin } from '../services/adminApi';
import type { AdminUser } from '../types/admin';

interface LoginViewProps {
  onSuccess: (admin: AdminUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
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
    <div className="min-h-screen bg-[#F3EBDD] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px] rounded-2xl bg-white border border-[#E6E0D3] p-8 shadow-[0_24px_70px_rgba(23,77,53,0.12)] sm:p-10">
        <div className="pb-6 mb-7 border-b border-[#E2E8F0]">
          <p className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#75513A]">
            Store administration
          </p>
          <h1 className="mt-1.5 font-serif-brand text-[30px] font-normal text-[#174D35] tracking-tight">
            PAK VEDA
          </h1>
          <p className="mt-1 text-[13.5px] text-[#475569]">
            Sign in to manage your PAK VEDA store.
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
              placeholder="name@company.com"
              className="w-full rounded-lg border border-[#D8DED8] bg-white px-3.5 py-2.5 text-[14px] text-[#23362B] focus:outline-none focus:border-[#174D35] focus:ring-2 focus:ring-[#174D35]/15"
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
              className="w-full rounded-lg border border-[#D8DED8] bg-white px-3.5 py-2.5 text-[14px] text-[#23362B] focus:outline-none focus:border-[#174D35] focus:ring-2 focus:ring-[#174D35]/15"
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
            className="w-full rounded-lg bg-[#174D35] hover:bg-[#103B29] disabled:opacity-60 text-white py-3 px-5 text-[12px] font-semibold uppercase tracking-[0.09em] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{loading ? 'Signing In...' : 'Sign In to Console'}</span>
            {!loading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#758078]">
          Authorized administrators only.
        </p>
      </div>
    </div>
  );
};
