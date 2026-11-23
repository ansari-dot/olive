import React from 'react';
import {
  ThumbsUp,
  BadgePercent,
  Truck,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { PartnerLogosStrip } from './PartnerLogosStrip';

interface AboutUsPageProps {
  onNavigateHome: () => void;
  onNavigateShop: (brandName?: string) => void;
  onNavigateContact: () => void;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({
  onNavigateHome,
  onNavigateShop,
  onNavigateContact,
}) => {
  return (
    <main className="w-full bg-white text-[#333333] font-sans antialiased">
      {/* =========================================================================
          1. BREADCRUMBS ROW (Exact format: Home > About Us with divider border)
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
            About Us
          </span>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 sm:pb-24">
        {/* =========================================================================
            2. MAIN STORY SECTION: 2-COLUMN SPLIT (Left Story & Quotes, Right Video Frame)
            ========================================================================= */}
        <section
          aria-labelledby="about-main-heading"
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center mb-16 sm:mb-20"
        >
          {/* Left Column: Heading, Prose & Distinct Quotation Block */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center">
            <h1
              id="about-main-heading"
              className="text-[30px] sm:text-[36px] lg:text-[40px] font-extrabold text-[#1F1F1F] tracking-tight leading-tight mb-5"
            >
              About Pak Veda
            </h1>

            <p className="text-[13.5px] sm:text-[14px] leading-[1.8] text-[#555555]">
              PAK VEDA is a natural products brand bringing a broad range of foods, spices,
              botanicals, pantry products and wellness categories together for everyday life.
            </p>

            {/* Blockquote with Accent Quotation Marks (Matching Reference Layout) */}
            <div className="relative my-6 px-6 sm:px-8 py-3 border-none">
              {/* Opening Accent Quote Mark */}
              <span
                className="absolute top-0 left-0 text-[#15472B] text-4xl sm:text-5xl font-serif font-black leading-none select-none"
                aria-hidden="true"
              >
                “
              </span>

              <p className="italic text-[13.5px] sm:text-[14px] leading-[1.75] text-[#4A4A4A]">
                Rooted in nature. Crafted for life. Our collection brings traditional ingredients and
                modern product choices together, with clear information to help customers explore.
              </p>

              {/* Closing Accent Quote Mark */}
              <span
                className="absolute bottom-0 right-1 text-[#15472B] text-4xl sm:text-5xl font-serif font-black leading-none select-none"
                aria-hidden="true"
              >
                ”
              </span>
            </div>

            <p className="text-[13.5px] sm:text-[14px] leading-[1.8] text-[#555555]">
              Our 28-category portfolio spans natural foods, spices, herbs, oils, teas, coffee, snacks,
              functional foods and supplements. PAK VEDA brings this range together for customers in
              Pakistan and international markets.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigateShop('All')}
                className="bg-[#15472B] hover:bg-[#0D2F1C] text-white text-[12px] font-bold uppercase tracking-[0.1em] px-8 py-3.5 rounded transition-all duration-200 shadow-sm cursor-pointer inline-flex items-center gap-2"
              >
                Shop Our Harvest
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNavigateContact}
                className="border border-[#15472B] text-[#15472B] hover:bg-[#15472B] hover:text-white text-[12px] font-bold uppercase tracking-[0.1em] px-7 py-3.5 rounded transition-all duration-200 cursor-pointer"
              >
                Contact Us
              </button>
            </div>
          </div>

          {/* Editorial product image */}
          <div className="lg:col-span-6 xl:col-span-6">
            <img
              src="/assets/images/hero_banner_botanical_tea_1794764573797.jpg"
              alt="A botanical tea and herbal infusion arrangement"
              className="aspect-[16/11] w-full rounded-xl object-cover shadow-[0_20px_50px_rgba(23,77,53,0.12)] sm:aspect-[16/10]"
              loading="lazy"
            />
          </div>
        </section>

        <section
          aria-label="PAK VEDA brand values"
          className="border-t border-b border-[#EEEEEE] py-8 sm:py-10 mb-16 sm:mb-24"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EEEEEE]">
            <div className="flex items-center gap-4 py-4 sm:py-2 px-3 sm:px-6">
              <div className="w-11 h-11 shrink-0 rounded-full bg-[#15472B]/10 flex items-center justify-center text-[#15472B]">
                <ThumbsUp className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-[12.5px] sm:text-[13px] font-bold text-[#1F1F1F] uppercase tracking-wide">
                  Quality
                </h2>
                <p className="text-[11.5px] text-[#777777] mt-0.5">
                  Clear, product-specific information
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 py-4 sm:py-2 px-3 sm:px-6">
              <div className="w-11 h-11 shrink-0 rounded-full bg-[#15472B]/10 flex items-center justify-center text-[#15472B]">
                <BadgePercent className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-[12.5px] sm:text-[13px] font-bold text-[#1F1F1F] uppercase tracking-wide">
                  Authenticity
                </h2>
                <p className="text-[11.5px] text-[#777777] mt-0.5">
                  Respect for ingredients and tradition
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 py-4 sm:py-2 px-3 sm:px-6">
              <div className="w-11 h-11 shrink-0 rounded-full bg-[#15472B]/10 flex items-center justify-center text-[#15472B]">
                <Truck className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-[12.5px] sm:text-[13px] font-bold text-[#1F1F1F] uppercase tracking-wide">
                  Transparency
                </h2>
                <p className="text-[11.5px] text-[#777777] mt-0.5">
                  Verified product information
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 py-4 sm:py-2 px-3 sm:px-6">
              <div className="w-11 h-11 shrink-0 rounded-full bg-[#15472B]/10 flex items-center justify-center text-[#15472B]">
                <ShieldCheck className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-[12.5px] sm:text-[13px] font-bold text-[#1F1F1F] uppercase tracking-wide">
                  Customer focus
                </h2>
                <p className="text-[11.5px] text-[#777777] mt-0.5">
                  A considered, easy-to-use shopping experience
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Product families */}
        <div className="mt-16 sm:mt-24 pt-6">
          <PartnerLogosStrip onSelectCategory={onNavigateShop} className="!px-0" />
        </div>
      </div>

    </main>
  );
};
