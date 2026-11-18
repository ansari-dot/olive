import React, { useState } from 'react';
import { Check, Mail, Loader2 } from 'lucide-react';
import { subscribeNewsletter } from '../services/api';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim();
    if (!cleaned) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await subscribeNewsletter(cleaned);
      setSubscribedEmail(cleaned);
      setEmail('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Subscription failed';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="w-full bg-[#F7F3EE] py-16 sm:py-20 lg:py-22 border-t border-[#EAE2D6]"
    >
      <div className="max-w-[760px] mx-auto px-6 sm:px-10 text-center">
        <div className="w-11 h-11 mx-auto mb-4 bg-white border border-[#E6DDD0] flex items-center justify-center text-[#15472B]">
          <Mail className="w-5 h-5 stroke-[1.5]" />
        </div>

        <p className="text-[11.5px] uppercase tracking-[0.16em] text-[#C46B3B] font-semibold mb-2">
          The Orchard Dispatch
        </p>

        <h2
          id="newsletter-heading"
          className="text-[30px] sm:text-[36px] lg:text-[40px] font-normal tracking-[-0.01em] text-[#111111] leading-tight"
        >
          Join Our Harvest Letter
        </h2>

        <p className="mt-3 text-[14.5px] sm:text-[15px] text-[#6E6A66] leading-relaxed max-w-[52ch] mx-auto">
          Receive early harvest press dates, seasonal Potohar olive oil releases, and wholesome pantry recipes straight to your inbox.
        </p>

        {errorMsg && (
          <p className="mt-4 text-[13px] text-[#9B1C1C] max-w-[540px] mx-auto">
            {errorMsg}
          </p>
        )}

        {subscribedEmail ? (
          <div className="mt-8 max-w-[540px] mx-auto bg-white border border-[#D4E2CE] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3 text-[#15472B]">
              <Check className="w-4 h-4 shrink-0" />
              <p className="text-[13.5px]">
                Thank you! <strong>{subscribedEmail}</strong> is subscribed to Zaitoon Pakistan’s Harvest Letter.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSubscribedEmail(null);
                setErrorMsg(null);
              }}
              className="text-[11.5px] uppercase tracking-[0.08em] text-[#666666] hover:text-[#111111] underline underline-offset-2 shrink-0 cursor-pointer"
            >
              Add another
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 max-w-[540px] mx-auto flex flex-col sm:flex-row bg-white border border-[#D6CFC5] focus-within:border-[#15472B] transition-colors"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="flex-1 px-4 py-3.5 text-[14px] text-[#181818] placeholder:text-[#8A857E] bg-transparent focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#788B23] hover:bg-[#15472B] disabled:bg-[#888888] text-white text-[12px] font-semibold uppercase tracking-[0.12em] px-8 py-3.5 transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>SUBSCRIBING...</span>
                </>
              ) : (
                <span>SUBSCRIBE</span>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
