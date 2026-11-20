import React from 'react';

interface HeritageBannerSectionProps {
  onShopNow: () => void;
  title?: string;
}

export const HeritageBannerSection: React.FC<HeritageBannerSectionProps> = ({
  onShopNow,
  title = 'ORGANIC & COLD-PRESSED HARVESTS',
}) => {
  return (
    <section
      aria-label="Artisanal Harvest Banner"
      className="w-full bg-white py-8 sm:py-12 lg:py-14 overflow-hidden"
    >
      <div className="max-w-[1400px] xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Box: Same to Same Format as Promo Banner (Deep Forest Green Gradient) */}
        <div className="relative w-full min-h-[220px] sm:min-h-[240px] lg:min-h-[260px] bg-[#123821] bg-gradient-to-r from-[#0E2D1A] via-[#1B4D2E] to-[#0E2D1A] rounded-2xs overflow-hidden shadow-md flex items-center justify-between px-4 sm:px-10 lg:px-16 py-8">
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
              LEFT: TILTED PRODUCT CUTOUT
              ========================================================================= */}
          <div className="relative flex items-center shrink-0 z-10 w-[140px] sm:w-[220px] lg:w-[280px] h-[190px] sm:h-[220px] lg:h-[250px] -ml-2 sm:-ml-4">
            <img
              src="/assets/images/nobg/card_oil_decanter_3_1794769257286_nobg.png"
              alt="Potohar Estate Cold-Pressed Oil"
              className="absolute -left-2 sm:left-2 bottom-0 w-[110px] sm:w-[160px] lg:w-[190px] h-auto max-h-[92%] object-contain -rotate-[12deg] drop-shadow-[0_16px_22px_rgba(0,0,0,0.45)] pointer-events-none transition-transform duration-500 hover:rotate-[-8deg]"
            />
          </div>

          {/* =========================================================================
              CENTER: BOLD WHITE HEADING + OUTLINED "SHOP NOW" BUTTON ONLY (NO CONTENT)
              ========================================================================= */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-2 sm:px-6 my-auto flex-1 min-w-0">
            <h2 className="text-[20px] sm:text-[26px] md:text-[30px] lg:text-[34px] font-black uppercase tracking-[0.06em] text-white leading-tight drop-shadow-sm">
              {title}
            </h2>

            {/* White Outlined Button (Same to Same) */}
            <div className="mt-4 sm:mt-5">
              <button
                type="button"
                onClick={onShopNow}
                className="border-2 border-white bg-transparent hover:bg-white text-white hover:text-[#123821] px-7 sm:px-9 py-2 sm:py-2.5 text-[11.5px] sm:text-[12.5px] font-black uppercase tracking-[0.14em] transition-all duration-200 cursor-pointer shadow-sm rounded-none hover:shadow-lg hover:scale-105 active:scale-95"
              >
                Shop Now
              </button>
            </div>
          </div>

          {/* =========================================================================
              RIGHT: STANDING PRODUCT DUO (Bleeding off bottom-right edge)
              ========================================================================= */}
          <div className="relative hidden md:flex items-end justify-end shrink-0 z-10 w-[140px] sm:w-[180px] lg:w-[240px] h-[190px] sm:h-[220px] lg:h-[250px] -mr-2 sm:-mr-4">
            {/* Primary Tall Estate Cruet */}
            <img
              src="/assets/images/nobg/featured_card_estate_cruet_1794769569072_nobg.png"
              alt="Pak Veda Estate Cruet"
              className="absolute right-12 lg:right-16 bottom-0 w-[95px] sm:w-[125px] lg:w-[145px] h-auto max-h-[96%] object-contain drop-shadow-[0_16px_22px_rgba(0,0,0,0.45)] pointer-events-none transition-transform duration-500 hover:scale-105"
            />

            {/* Secondary Himalayan Sidr Honeycomb Jar */}
            <img
              src="/assets/images/nobg/unique_sidr_honeycomb_jar_1794820496427_nobg.png"
              alt="Raw Himalayan Sidr Honey"
              className="absolute right-0 bottom-0 w-[70px] sm:w-[90px] lg:w-[105px] h-auto max-h-[80%] object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.4)] pointer-events-none transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
