import React, { useState } from 'react';
import {
  ThumbsUp,
  BadgePercent,
  Truck,
  ShieldCheck,
  ShoppingBag,
  Play,
  X,
  ArrowRight,
} from 'lucide-react';
import { BrandItem } from '../data/storeData';
import { PartnerLogosStrip } from './PartnerLogosStrip';

interface AboutUsPageProps {
  brands: BrandItem[];
  onNavigateHome: () => void;
  onNavigateShop: (brandName?: string) => void;
  onNavigateContact: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  fallbackImage: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'team-1',
    name: 'Tariq Mahmood',
    role: 'Master Orchardist (Potohar)',
    image: '/assets/images/team/team_member_1.jpg',
    fallbackImage:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'team-2',
    name: 'Zainul Abideen',
    role: 'Cold-Press Miller (Chakwal)',
    image: '/assets/images/team/team_member_2.jpg',
    fallbackImage:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'team-3',
    name: 'Dr. Ayesha Rehman',
    role: 'Quality & Formulations Director',
    image: '/assets/images/team/team_member_3.jpg',
    fallbackImage:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'team-4',
    name: 'Nadia Farooq',
    role: 'Herbalist & Swat Sourcing',
    image: '/assets/images/team/team_member_4.jpg',
    fallbackImage:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'team-5',
    name: 'Khurram Shahzad',
    role: 'Founder & Managing Director',
    image: '/assets/images/team/team_member_5.jpg',
    fallbackImage:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
  },
];

export const AboutUsPage: React.FC<AboutUsPageProps> = ({
  brands,
  onNavigateHome,
  onNavigateShop,
  onNavigateContact,
}) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoPosterError, setVideoPosterError] = useState(false);

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
              Pak Veda was founded with an uncompromising dedication to pure, unrefined nourishment.
              From the sun-bathed limestone ridges of Chakwal and the historic Potohar olive belt to
              the pristine alpine valleys of Swat and Gilgit-Baltistan, we unite multi-generational
              olive orchardists, mountain beekeepers, and heritage botanical growers across Pakistan.
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
                We believe true vitality begins in the living soil. Every cold-pressed oil, raw mountain
                honey, and botanical remedy is crafted without chemical extraction, synthetic solvents,
                or high-heat damage—preserving the live bio-active enzymes and rich polyphenols nurtured
                by Pakistan’s fertile terroir.
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
              Unlike mass-refined commercial goods, our complete 28-category portfolio—spanning
              single-estate extra virgin olive oils, pure Himalayan Shilajit, cold-pressed black seed
              and almond extracts, and wild mountain Sidr honey—is batch-tested, certified single-origin,
              and packaged in UV-protective dark amber glass to preserve peak harvest potency.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigateShop('All Brands')}
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

          {/* Right Column: Video Poster Frame with Centered Play Button */}
          <div className="lg:col-span-6 xl:col-span-6">
            <div className="relative aspect-[16/11] sm:aspect-[16/10] w-full rounded-md overflow-hidden shadow-lg group bg-[#F5F5F5]">
              <img
                src={
                  videoPosterError
                    ? '/assets/images/hero_zaitoon_olive_grove_1794763964188.jpg'
                    : '/assets/images/team/about_story_grove_video.jpg'
                }
                alt="Pak Veda olive harvest and artisan cold press documentary preview"
                onError={() => setVideoPosterError(true)}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gentle gradient overlay for high contrast */}
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors duration-300" />

              {/* Centered Circular Video Play Button (Exact Reference Match) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <button
                  type="button"
                  onClick={() => setIsVideoOpen(true)}
                  aria-label="Play Pak Veda harvest story video"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 hover:bg-[#15472B] border-2 border-white flex items-center justify-center text-white shadow-2xl transition-all duration-300 transform group-hover:scale-110 cursor-pointer focus:outline-none focus:ring-4 focus:ring-white/40"
                >
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white translate-x-0.5" />
                </button>
                <span className="mt-3 text-xs sm:text-sm font-semibold tracking-wider text-white uppercase drop-shadow">
                  Watch Our Story
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. FEATURES / VALUE PROPOSITIONS ROW (4 Columns with Dividers & Icons)
            Exact match: 100% Satisfaction, Save 20%, Fast Free Shipment, 60-Day Money Back
            ========================================================================= */}
        <section
          aria-label="Store Value Guarantees"
          className="border-t border-b border-[#EEEEEE] py-8 sm:py-10 mb-16 sm:mb-24"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EEEEEE]">
            {/* Feature 1: 100% SATISFACTION */}
            <div className="flex items-center gap-4 py-4 sm:py-2 px-3 sm:px-6">
              <div className="w-11 h-11 shrink-0 rounded-full bg-[#15472B]/10 flex items-center justify-center text-[#15472B]">
                <ThumbsUp className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-[12.5px] sm:text-[13px] font-bold text-[#1F1F1F] uppercase tracking-wide">
                  100% Satisfaction
                </h2>
                <p className="text-[11.5px] text-[#777777] mt-0.5">
                  Certified organic &amp; lab-tested
                </p>
              </div>
            </div>

            {/* Feature 2: SAVE 20% WHEN YOU */}
            <div className="flex items-center gap-4 py-4 sm:py-2 px-3 sm:px-6">
              <div className="w-11 h-11 shrink-0 rounded-full bg-[#15472B]/10 flex items-center justify-center text-[#15472B]">
                <BadgePercent className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-[12.5px] sm:text-[13px] font-bold text-[#1F1F1F] uppercase tracking-wide">
                  Save 20% When You
                </h2>
                <p className="text-[11.5px] text-[#777777] mt-0.5">
                  Use coupon code VEDA20
                </p>
              </div>
            </div>

            {/* Feature 3: FAST FREE SHIPMENT */}
            <div className="flex items-center gap-4 py-4 sm:py-2 px-3 sm:px-6">
              <div className="w-11 h-11 shrink-0 rounded-full bg-[#15472B]/10 flex items-center justify-center text-[#15472B]">
                <Truck className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-[12.5px] sm:text-[13px] font-bold text-[#1F1F1F] uppercase tracking-wide">
                  Fast Free Shipment
                </h2>
                <p className="text-[11.5px] text-[#777777] mt-0.5">
                  Across Pakistan on Rs. 3,500+
                </p>
              </div>
            </div>

            {/* Feature 4: 60-DAY MONEY BACK */}
            <div className="flex items-center gap-4 py-4 sm:py-2 px-3 sm:px-6">
              <div className="w-11 h-11 shrink-0 rounded-full bg-[#15472B]/10 flex items-center justify-center text-[#15472B]">
                <ShieldCheck className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-[12.5px] sm:text-[13px] font-bold text-[#1F1F1F] uppercase tracking-wide">
                  60-Day Money Back
                </h2>
                <p className="text-[11.5px] text-[#777777] mt-0.5">
                  100% Purity &amp; refund promise
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. "OUR TEAM" SECTION (Exact layout: Header + Badge + 5 Portrait Cards)
            ========================================================================= */}
        <section aria-labelledby="our-team-heading" className="w-full">
          {/* Section Header: "OUR TEAM" + Shopping Bag Badge with Flanking Lines */}
          <div className="text-center mb-10 sm:mb-12">
            <h2
              id="our-team-heading"
              className="text-[26px] sm:text-[32px] font-extrabold text-[#1F1F1F] uppercase tracking-wider mb-2.5"
            >
              Our Team
            </h2>

            {/* Centered Brand Shopping Bag Badge with Rules (Matches Testimonials header motif) */}
            <div className="flex items-center justify-center gap-3">
              <span className="w-12 sm:w-20 h-[1.5px] bg-[#DDDDDD]" aria-hidden="true" />
              <div
                className="w-8 h-8 rounded bg-[#15472B] text-white flex items-center justify-center shadow-sm"
                aria-hidden="true"
              >
                <ShoppingBag className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="w-12 sm:w-20 h-[1.5px] bg-[#DDDDDD]" aria-hidden="true" />
            </div>
          </div>

          {/* 5-Column Grid with Studio Portrait Photos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-7">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.id}
                className="group flex flex-col items-center bg-white text-center transition-transform duration-300"
              >
                {/* Clean Studio Photo Frame */}
                <div className="w-full aspect-[3/4] bg-[#F7F7F7] overflow-hidden rounded-sm border border-[#F0F0F0] relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== member.fallbackImage) {
                        target.src = member.fallbackImage;
                      }
                    }}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Name & Title */}
                <h3 className="font-bold text-[14px] sm:text-[15px] text-[#222222] mt-3.5 tracking-tight group-hover:text-[#15472B] transition-colors">
                  {member.name}
                </h3>
                <p className="text-[11px] sm:text-[11.5px] text-[#777777] uppercase tracking-wider mt-0.5">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            5. PARTNER / CERTIFIED BRAND LOGOS STRIP (Exact Reference Match)
            ========================================================================= */}
        <div className="mt-16 sm:mt-24 pt-6">
          <PartnerLogosStrip onSelectBrand={(brandName) => onNavigateShop(brandName)} className="!px-0" />
        </div>
      </div>

      {/* =========================================================================
          6. INTERACTIVE VIDEO MODAL (Activated by Video Play Button)
          ========================================================================= */}
      {isVideoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pak Veda Harvest Documentary"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsVideoOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#141A16] border-b border-[#243329] text-white">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#15472B] animate-pulse" />
                <span className="text-xs sm:text-sm font-semibold tracking-wide">
                  The Story of Pak Veda — Soil to Bottle Documentary
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsVideoOpen(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
                aria-label="Close video"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Frame */}
            <div className="relative aspect-video w-full bg-[#0D120F]">
              <iframe
                className="w-full h-full"
                src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1"
                title="Pak Veda Harvest Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-[#111512] text-xs text-gray-400 flex items-center justify-between">
              <span>Chakwal, Potohar Valley &amp; Swat Highlands</span>
              <button
                type="button"
                onClick={() => {
                  setIsVideoOpen(false);
                  onNavigateShop('All Brands');
                }}
                className="text-[#788B23] hover:text-white font-semibold transition-colors cursor-pointer"
              >
                Explore Featured Harvests &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
