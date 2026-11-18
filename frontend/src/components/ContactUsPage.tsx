import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { submitContactInquiry } from '../services/api';

interface ContactUsPageProps {
  onNavigateHome: () => void;
  onNavigateShop: () => void;
}

const INQUIRY_TOPICS = [
  'Order & Cash on Delivery',
  'Product Harvest & Lab Purity',
  'Bulk & Corporate Gifting',
  'Orchard & Wholesale Partnership',
];

export const ContactUsPage: React.FC<ContactUsPageProps> = ({
  onNavigateHome,
  onNavigateShop,
}) => {
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [city, setCity] = useState('Islamabad');
  const [topic, setTopic] = useState(INQUIRY_TOPICS[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanContact = contactInfo.trim();
    const cleanMsg = message.trim();
    if (!cleanName || !cleanContact || !cleanMsg) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await submitContactInquiry({
        name: cleanName,
        contactInfo: cleanContact,
        city,
        topic,
        message: cleanMsg,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit inquiry';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="w-full bg-white py-10 sm:py-12 lg:py-14">
      <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Top Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-[12.5px] text-[#777777]">
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-[#181818] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="mx-1.5" aria-hidden="true">
            /
          </span>
          <span className="text-[#444444]">Contact Us</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-10 border-b border-[#EAEAEA]">
          <div>
            <p className="text-[11.5px] uppercase tracking-[0.12em] text-[#C46B3B] font-semibold mb-1.5">
              Orchard Hub &amp; Care
            </p>
            <h1 className="text-[30px] sm:text-[36px] font-normal text-[#181818] leading-tight">
              Contact Zaitoon Pakistan
            </h1>
          </div>
          <button
            type="button"
            onClick={onNavigateShop}
            className="self-start sm:self-auto border border-[#181818] bg-white hover:bg-[#181818] hover:text-white px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#181818] transition-colors cursor-pointer shrink-0"
          >
            BROWSE SHOP
          </button>
        </div>

        {/* 2-Column Layout: Hub Details + Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Orchard Contact Details */}
          <div className="lg:col-span-5 bg-[#FAF3F0] p-7 sm:p-9 space-y-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.09em] text-[#C46B3B] font-semibold">
                Orchard Dispatch Hub
              </p>
              <p className="mt-1.5 text-[14.5px] text-[#181818] leading-relaxed">
                Potohar Olive Belt · Chakwal Road, Islamabad, Pakistan
              </p>
            </div>

            <div className="pt-5 border-t border-[#EAE0D5]">
              <p className="text-[11px] uppercase tracking-[0.09em] text-[#C46B3B] font-semibold">
                Email Care
              </p>
              <p className="mt-1.5 text-[14.5px] text-[#181818]">
                <a
                  href="mailto:care@zaitoonpakistan.pk"
                  className="hover:text-[#15472B] underline underline-offset-4"
                >
                  care@zaitoonpakistan.pk
                </a>
              </p>
            </div>

            <div className="pt-5 border-t border-[#EAE0D5]">
              <p className="text-[11px] uppercase tracking-[0.09em] text-[#C46B3B] font-semibold">
                Phone &amp; Order Support
              </p>
              <p className="mt-1.5 text-[14.5px] text-[#181818] tabular-nums">
                +92 300 0000000 (Mon–Sat, 9:00 AM – 6:00 PM PKT)
              </p>
            </div>

            <div className="pt-5 border-t border-[#EAE0D5]">
              <p className="text-[11px] uppercase tracking-[0.09em] text-[#C46B3B] font-semibold">
                Wholesale &amp; Gifting Inquiries
              </p>
              <p className="mt-1.5 text-[13.5px] text-[#555555] leading-relaxed">
                For custom corporate gift boxes, restaurant bulk tins (5 Litre), or orchard harvest partnerships, submit your inquiry using the form.
              </p>
            </div>
          </div>

          {/* Right Inquiry Form */}
          <div className="lg:col-span-7">
            {submitted ? (
              <div className="p-8 sm:p-10 border border-[#DCEAD5] bg-[#F6F9F4] space-y-4">
                <div className="w-10 h-10 bg-[#15472B] text-white flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <h2 className="text-[22px] font-normal text-[#181818]">
                  Thank you for reaching out
                </h2>
                <p className="text-[14px] text-[#555555] leading-relaxed">
                  Your message regarding &ldquo;{topic}&rdquo; has been received by our Islamabad orchard desk. An orchard manager will respond to {contactInfo} within 24 business hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setName('');
                    setContactInfo('');
                    setMessage('');
                  }}
                  className="mt-2 px-6 py-2.5 bg-[#0B0B0B] hover:bg-[#15472B] text-white text-[11.5px] uppercase tracking-[0.08em] font-semibold transition-colors cursor-pointer"
                >
                  SEND ANOTHER MESSAGE
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="border border-[#EAEAEA] p-7 sm:p-9 space-y-5">
                <h2 className="text-[20px] font-normal text-[#181818] pb-3 border-b border-[#EFEFEF]">
                  Send an Inquiry
                </h2>

                {errorMsg && (
                  <div className="p-3 bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-[13px]">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-[11.5px] uppercase tracking-[0.07em] text-[#444444] mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tariq Mehmood"
                      className="w-full border border-[#D4D4D4] px-3.5 py-2.5 text-[13.5px] text-[#1C1C1C] focus:outline-none focus:border-[#181818]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-info"
                      className="block text-[11.5px] uppercase tracking-[0.07em] text-[#444444] mb-1.5"
                    >
                      Email or Mobile
                    </label>
                    <input
                      id="contact-info"
                      type="text"
                      required
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder="name@email.com or 03XX-XXXXXXX"
                      className="w-full border border-[#D4D4D4] px-3.5 py-2.5 text-[13.5px] text-[#1C1C1C] focus:outline-none focus:border-[#181818]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-city"
                      className="block text-[11.5px] uppercase tracking-[0.07em] text-[#444444] mb-1.5"
                    >
                      City
                    </label>
                    <select
                      id="contact-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full border border-[#D4D4D4] px-3.5 py-2.5 text-[13.5px] bg-white text-[#1C1C1C] focus:outline-none focus:border-[#181818]"
                    >
                      <option>Islamabad</option>
                      <option>Lahore</option>
                      <option>Karachi</option>
                      <option>Rawalpindi</option>
                      <option>Peshawar</option>
                      <option>Multan</option>
                      <option>Faisalabad</option>
                      <option>Other City in Pakistan</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="contact-topic"
                      className="block text-[11.5px] uppercase tracking-[0.07em] text-[#444444] mb-1.5"
                    >
                      Inquiry Topic
                    </label>
                    <select
                      id="contact-topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full border border-[#D4D4D4] px-3.5 py-2.5 text-[13.5px] bg-white text-[#1C1C1C] focus:outline-none focus:border-[#181818]"
                    >
                      {INQUIRY_TOPICS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-[11.5px] uppercase tracking-[0.07em] text-[#444444] mb-1.5"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your order reference, harvest question, or delivery inquiry..."
                    className="w-full border border-[#D4D4D4] px-3.5 py-2.5 text-[13.5px] text-[#1C1C1C] focus:outline-none focus:border-[#181818]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-[#0B0B0B] hover:bg-[#15472B] disabled:bg-[#888888] text-white text-[11.5px] font-semibold uppercase tracking-[0.08em] px-8 py-3 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>SENDING...</span>
                    </>
                  ) : (
                    <span>SEND MESSAGE</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
