import React, { useState } from 'react';
import { Check, Loader2, MapPin } from 'lucide-react';
import { submitContactInquiry } from '../services/api';

interface ContactUsPageProps {
  onNavigateHome: () => void;
  onNavigateShop: () => void;
}

export const ContactUsPage: React.FC<ContactUsPageProps> = ({
  onNavigateHome,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim() || 'General Inquiry';
    const cleanMsg = message.trim();

    if (!cleanName || !cleanEmail || !cleanMsg) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await submitContactInquiry({
        name: cleanName,
        contactInfo: cleanEmail,
        city: 'Islamabad',
        topic: cleanSubject,
        message: cleanMsg,
      });
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit inquiry';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="w-full bg-white text-[#333333] font-sans antialiased">
      {/* =========================================================================
          1. BREADCRUMBS ROW (Exact format: Home > Contact Us with divider border)
          ========================================================================= */}
      <div className="w-full border-b border-[#EEEEEE] bg-white">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center text-[12.5px] text-[#777777]">
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-[#15472B] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="mx-2 text-[#CCCCCC] select-none" aria-hidden="true">
            &gt;
          </span>
          <span className="text-[#15472B] font-semibold tracking-wide">
            Contact Us
          </span>
        </div>
      </div>

      {/* =========================================================================
          2. FULL-WIDTH INTERACTIVE MAP (Exact Reference Position Below Breadcrumbs)
          ========================================================================= */}
      <div className="w-full h-[340px] sm:h-[400px] lg:h-[430px] bg-[#E8ECE9] relative border-b border-[#EEEEEE] overflow-hidden">
        {/* OpenStreetMap Iframe centered on Pak Veda Dispatch & Orchard Hub in Islamabad */}
        <iframe
          title="Pak Veda Headquarters and Dispatch Hub Map"
          className="w-full h-full border-0 filter grayscale-[25%] contrast-[1.05]"
          src="https://www.openstreetmap.org/export/embed.html?bbox=73.0200%2C33.7000%2C73.1200%2C33.7600&amp;layer=mapnik&amp;marker=33.7294%2C73.0931"
          loading="lazy"
        />

        {/* Custom Centered Brand Location Card Pin */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 bg-white/95 backdrop-blur-sm p-4 sm:p-5 shadow-lg border border-[#E0E0E0] max-w-[280px] pointer-events-auto">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#15472B] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <MapPin className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-bold text-[13px] text-[#1F1F1F] leading-snug">
                Pak Veda Central Hub
              </h3>
              <p className="text-[11px] text-[#666666] mt-0.5 leading-relaxed">
                Potohar Olive Estate, Sector F-7/2, Islamabad, Pakistan
              </p>
              <div className="mt-2 text-[10.5px] font-semibold text-[#15472B] uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#15472B] animate-pulse" />
                Active Dispatch Desk
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MAIN 2-COLUMN SECTION: GET IN TOUCH (Form Left) + INFO & SOCIALS (Right)
          ========================================================================= */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* =====================================================================
              LEFT COLUMN (col-span-8): GET IN TOUCH FORM
              ===================================================================== */}
          <div className="lg:col-span-8">
            <h1 className="text-[22px] sm:text-[24px] font-extrabold uppercase tracking-wide text-[#1F1F1F] mb-6">
              Get In Touch
            </h1>

            {submitted && (
              <div className="mb-6 p-4 sm:p-5 border border-[#DCEAD5] bg-[#F6F9F4] text-[#15472B] flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#15472B] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="font-bold text-[14px]">Thank you for reaching out!</h2>
                  <p className="text-[12.5px] text-[#4A5D4E] mt-0.5">
                    Your inquiry has been delivered directly to our customer care desk. We will respond within 24 business hours.
                  </p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-3.5 bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-[13px]">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 3-Column Input Row (Exact Reference: Name* | Email* | subject*) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name*"
                    className="w-full bg-[#FBFBFA] border border-[#E5E5E5] px-4 py-3 text-[13.5px] text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#15472B] focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email*"
                    className="w-full bg-[#FBFBFA] border border-[#E5E5E5] px-4 py-3 text-[13.5px] text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#15472B] focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="subject*"
                    className="w-full bg-[#FBFBFA] border border-[#E5E5E5] px-4 py-3 text-[13.5px] text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#15472B] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Multiline Message Textarea (Exact Reference: Message*) */}
              <div>
                <textarea
                  rows={7}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Message*"
                  className="w-full bg-[#FBFBFA] border border-[#E5E5E5] px-4 py-3.5 text-[13.5px] text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#15472B] focus:bg-white transition-all resize-y"
                />
              </div>

              {/* Submit Button (Solid Brand Green Button, avoiding unwanted red) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#15472B] hover:bg-[#0D2F1C] disabled:bg-[#888888] text-white text-[12px] font-bold uppercase tracking-[0.1em] px-8 py-3.5 shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>SENDING...</span>
                    </>
                  ) : (
                    <span>SEND MESSAGE</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* =====================================================================
              RIGHT COLUMN (col-span-4): ADDRESS, PHONE, EMAIL, OPENING TIME, SOCIALS
              ===================================================================== */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Address */}
            <div className="border-b border-[#EAEAEA] pb-5">
              <h2 className="text-[12px] font-extrabold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                Address
              </h2>
              <p className="text-[13px] text-[#666666] leading-relaxed">
                Potohar Olive Estate, Sector F-7/2, Islamabad 44000, Pakistan
              </p>
            </div>

            {/* Phone */}
            <div className="border-b border-[#EAEAEA] pb-5">
              <h2 className="text-[12px] font-extrabold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                Phone
              </h2>
              <p className="text-[13px] text-[#666666] leading-relaxed tabular-nums">
                (+92) 300-8547221 — (+92) 51-2856401
              </p>
            </div>

            {/* Email */}
            <div className="border-b border-[#EAEAEA] pb-5">
              <h2 className="text-[12px] font-extrabold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                Email
              </h2>
              <p className="text-[13px] text-[#666666] leading-relaxed">
                <a
                  href="mailto:care@pakveda.pk"
                  className="hover:text-[#15472B] transition-colors"
                >
                  care@pakveda.pk
                </a>{' '}
                —{' '}
                <a
                  href="mailto:orders@pakveda.pk"
                  className="hover:text-[#15472B] transition-colors"
                >
                  orders@pakveda.pk
                </a>
              </p>
            </div>

            {/* Opening Time */}
            <div className="border-b border-[#EAEAEA] pb-5">
              <h2 className="text-[12px] font-extrabold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                Opening Time
              </h2>
              <p className="text-[13px] text-[#666666] leading-relaxed">
                8:00Am - 10:00Pm, Sunday Close
              </p>
            </div>

            {/* Follow Us On (Social Icons Row: Facebook, X, TikTok, Instagram, YouTube, WhatsApp) */}
            <div>
              <h2 className="text-[12px] font-extrabold uppercase tracking-wider text-[#1F1F1F] mb-3">
                Follow Us On
              </h2>
              <div className="flex items-center gap-4 text-[#555555]">
                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow Pak Veda on Facebook"
                  className="hover:text-[#15472B] transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.667 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z" />
                  </svg>
                </a>

                {/* X / Twitter */}
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow Pak Veda on X"
                  className="hover:text-[#15472B] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* TikTok */}
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow Pak Veda on TikTok"
                  className="hover:text-[#15472B] transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow Pak Veda on Instagram"
                  className="hover:text-[#15472B] transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow Pak Veda on YouTube"
                  className="hover:text-[#15472B] transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/923008547221"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Contact Pak Veda on WhatsApp"
                  className="hover:text-[#15472B] transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 0C5.396 0 0 5.396 0 12.031c0 2.115.552 4.179 1.603 5.998L.068 24l6.166-1.618a12.008 12.008 0 0 0 5.797 1.488h.005c6.635 0 12.031-5.396 12.031-12.031 0-3.214-1.252-6.236-3.525-8.508A11.954 11.954 0 0 0 12.031 0zm0 22.023h-.004c-1.796 0-3.557-.483-5.093-1.396l-.365-.217-3.784.993 1.01-3.689-.237-.377a9.98 9.98 0 0 1-1.534-5.306c0-5.518 4.49-10.008 10.012-10.008 2.673 0 5.187 1.042 7.078 2.933a9.954 9.954 0 0 1 2.934 7.076c0 5.519-4.49 10.009-10.012 10.009zm5.485-7.493c-.301-.151-1.782-.88-2.059-.98-.276-.101-.477-.151-.678.151-.2.301-.779.98-.955 1.181-.176.201-.352.226-.653.075s-1.272-.469-2.423-1.496c-.896-.799-1.501-1.786-1.677-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.352.452-.527.151-.176.201-.301.301-.502.101-.201.05-.377-.025-.527-.075-.151-.678-1.633-.929-2.236-.245-.588-.494-.508-.678-.517l-.578-.01c-.2 0-.527.075-.803.377s-1.055 1.03-1.055 2.511 1.08 2.913 1.231 3.114c.151.201 2.125 3.245 5.148 4.552.719.311 1.28.497 1.718.636.722.23 1.379.197 1.898.12.579-.086 1.782-.728 2.033-1.431.251-.703.251-1.306.176-1.431-.075-.125-.276-.201-.577-.352z" />
                  </svg>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};
