import React from 'react';

interface PromoBannerSectionProps {
  onShopNow: () => void;
  title?: string;
  subtitle?: string;
  discountBadge?: {
    line1: string;
    line2: string;
    percent: string;
  };
}

export const PromoBannerSection: React.FC<PromoBannerSectionProps> = React.memo(({
  onShopNow,
  title = 'A NATURAL WORLD OF CHOICE',
  subtitle = 'Explore natural foods, botanicals, pantry essentials and wellness products.',
  discountBadge,
}) => {
  return (
    <section
      aria-label="Promotional Harvest Banner"
      className="w-full bg-white py-8 sm:py-12 lg:py-14 overflow-hidden"
    >
      <div className="max-w-[1400px] xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Box: Brand Terracotta Gradient */}
        <div className="relative w-full min-h-[220px] sm:min-h-[240px] lg:min-h-[260px] bg-[#B85728] bg-gradient-to-r from-[#A4491E] via-[#C46B3B] to-[#A4491E] rounded-2xs overflow-hidden shadow-md flex items-center justify-between px-4 sm:px-10 lg:px-16 py-8">
          {/* Subtle Geometric Low-Poly Facet Texture Overlay */}
          <svg
            className="absolute inset-0 w-full h-full opacity-10 pointer-events-none mix-blend-overlay"
            preserveAspectRatio="none"
            viewBox="0 0 1000 300"
          >
            <polygon points="0,0 300,0 200,300 0,300" fill="#ffffff" />
            <polygon points="300,0 550,0 450,300 200,300" fill="#000000" />
            <polygon points="550,0 800,0 700,300 450,300" fill="#ffffff" />
            <polygon points="800,0 1000,0 1000,300 700,300" fill="#000000" />
          </svg>

          {/* =========================================================================
              LEFT PRODUCT CUTOUT + CIRCULAR YELLOW "BEST DISCOUNT -20%" BADGE
              ========================================================================= */}
          <div className="relative flex items-center shrink-0 z-10 w-[140px] sm:w-[220px] lg:w-[280px] h-[190px] sm:h-[220px] lg:h-[250px] -ml-2 sm:-ml-4">
            {/* Tilted Olive Oil Bottle (Bleeding slightly off left/bottom) */}
            <img
              src="/assets/images/featured_card_teardrop_oil_1794769568371.jpg"
              alt="Olive oil product"
              loading="lazy"
              decoding="async"
              className="absolute -left-2 sm:left-2 bottom-0 w-[110px] sm:w-[160px] lg:w-[190px] h-auto max-h-[92%] object-contain -rotate-[14deg] drop-shadow-[0_16px_22px_rgba(0,0,0,0.4)] pointer-events-none transition-transform duration-500 hover:rotate-[-10deg]"
            />

            {/* Bright Yellow Circular Discount Sticker Badge (Exact match to reference) */}
            {discountBadge && <div className="absolute left-[70px] sm:left-[115px] lg:left-[135px] top-[15px] sm:top-[22px] lg:top-[28px] w-[74px] h-[74px] sm:w-[86px] sm:h-[86px] lg:w-[94px] lg:h-[94px] rounded-full bg-[#D6B878] shadow-[0_6px_16px_rgba(0,0,0,0.18)] flex flex-col items-center justify-center select-none shrink-0 border-2 border-white/30 z-20 transition-transform duration-300 hover:scale-105">
              <span className="text-[11.5px] sm:text-[13px] font-extrabold text-[#111111] leading-none tracking-tight">
                {discountBadge.line1}
              </span>
              <span className="text-[11.5px] sm:text-[13px] font-extrabold text-[#111111] leading-none tracking-tight mt-0.5">
                {discountBadge.line2}
              </span>
              <span className="text-[14px] sm:text-[16px] lg:text-[17px] font-black text-[#A4491E] leading-none tracking-tight mt-1">
                {discountBadge.percent}
              </span>
            </div>}
          </div>

          {/* =========================================================================
              CENTER: BOLD WHITE HEADING + OUTLINED "SHOP NOW" BUTTON
              ========================================================================= */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-2 sm:px-6 my-auto flex-1 min-w-0">
            <h2 className="text-[20px] sm:text-[26px] md:text-[30px] lg:text-[34px] font-black uppercase tracking-[0.06em] text-white leading-tight drop-shadow-sm">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-[12px] sm:text-[13px] lg:text-[14px] text-white/90 font-medium max-w-[540px] leading-relaxed hidden sm:block">
                {subtitle}
              </p>
            )}

            {/* White Outlined Button (Exact Match to Reference Image) */}
            <div className="mt-4 sm:mt-5">
              <button
                type="button"
                onClick={onShopNow}
                className="border-2 border-white bg-transparent hover:bg-white text-white hover:text-[#A4491E] px-7 sm:px-9 py-2 sm:py-2.5 text-[11.5px] sm:text-[12.5px] font-black uppercase tracking-[0.14em] transition-all duration-200 cursor-pointer shadow-sm rounded-none hover:shadow-lg hover:scale-105 active:scale-95"
              >
                Shop Now
              </button>
            </div>
          </div>

          {/* =========================================================================
              RIGHT: STANDING PRODUCT DUO (Bleeding off bottom-right edge)
              ========================================================================= */}
          <div className="relative hidden md:flex items-end justify-end shrink-0 z-10 w-[140px] sm:w-[180px] lg:w-[240px] h-[190px] sm:h-[220px] lg:h-[250px] -mr-2 sm:-mr-4">
            {/* Primary Tall Decanter/Cruet */}
            <img
              src="/assets/images/card_oil_cruet_1_1794769256413.jpg"
              alt="Olive oil product"
              loading="lazy"
              decoding="async"
              className="absolute right-12 lg:right-16 bottom-0 w-[95px] sm:w-[125px] lg:w-[145px] h-auto max-h-[96%] object-contain drop-shadow-[0_16px_22px_rgba(0,0,0,0.4)] pointer-events-none transition-transform duration-500 hover:scale-105"
            />

            {/* Secondary Amber Botanical Dropper Bottle */}
            <img
              src="/assets/images/shop_card_amber_bottle_1794770042120.jpg"
              alt="Botanical oil product"
              loading="lazy"
              decoding="async"
              className="absolute right-0 bottom-0 w-[70px] sm:w-[90px] lg:w-[105px] h-auto max-h-[80%] object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.35)] pointer-events-none transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>
      </div>
    </section>
  );
});

