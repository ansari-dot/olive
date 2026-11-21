import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface PartnerLogosStripProps {
  title?: string;
  description?: string;
  showBadge?: boolean;
  onSelectBrand?: (brandName: string) => void;
  className?: string;
}

export const PartnerLogosStrip: React.FC<PartnerLogosStripProps> = React.memo(({
  title = 'OUR PARTNERS',
  description = 'Certified single-estate olive groves, cold-press extraction mills, and wild mountain apiaries partnering across Pakistan.',
  showBadge = true,
  onSelectBrand,
  className = '',
}) => {
  const partners = [
    {
      id: 'magna',
      name: 'MAGNA',
      origin: 'Potohar Valley Reserve',
      targetBrand: 'Zaitoon Reserve',
      renderLogo: () => (
        <div className="flex flex-col items-center justify-center">
          {/* Geometrical Chevron architectural icon */}
          <svg
            viewBox="0 0 100 44"
            className="w-14 h-7 fill-none stroke-current"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Left 2 diagonal stripes */}
            <line x1="14" y1="38" x2="30" y2="8" />
            <line x1="26" y1="38" x2="42" y2="8" />
            {/* Center chevron peak */}
            <path d="M42 8 L50 36 L58 8" />
            {/* Right 2 diagonal stripes */}
            <line x1="58" y1="8" x2="74" y2="38" />
            <line x1="70" y1="8" x2="86" y2="38" />
          </svg>
          <span className="font-sans font-bold text-[11.5px] sm:text-[12px] tracking-[0.3em] uppercase text-inherit mt-2">
            MAGNA
          </span>
        </div>
      ),
    },
    {
      id: 'logoname',
      name: 'LOGONAME',
      origin: 'Karakoram Shilajit & Tea',
      targetBrand: 'Pak Veda Reserve',
      renderLogo: () => (
        <div className="flex flex-col items-center justify-center">
          {/* Circular badge with interlocking monogram */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-current flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 stroke-white fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round"
            >
              <circle cx="8" cy="12" r="4" />
              <circle cx="16" cy="12" r="4" />
            </svg>
          </div>
          <span className="font-sans font-medium text-[9.5px] sm:text-[10px] tracking-[0.25em] uppercase text-inherit mt-2">
            LOGONAME
          </span>
        </div>
      ),
    },
    {
      id: 'branding',
      name: 'BRANDING',
      origin: 'Swat Organic Botanicals',
      targetBrand: 'Pak Veda Organics',
      renderLogo: () => (
        <div className="flex flex-col items-center justify-center text-center">
          <span className="font-serif font-bold text-[16px] sm:text-[18px] tracking-[0.14em] uppercase text-inherit leading-tight">
            BRANDING
          </span>
          <span className="font-sans font-semibold text-[8.5px] sm:text-[9px] tracking-[0.26em] uppercase text-inherit/80 mt-1">
            CLASSIC DESIGN
          </span>
        </div>
      ),
    },
    {
      id: 'hosoren',
      name: 'HOSOREN',
      origin: 'Raw Sidr Mountain Honey',
      targetBrand: 'Himalayan Sidr',
      renderLogo: () => (
        <div className="flex flex-col items-center justify-center text-center">
          <span className="font-serif font-semibold text-[16px] sm:text-[18px] tracking-[0.16em] uppercase text-inherit leading-tight">
            HOSOREN
          </span>
          <div className="flex items-center gap-1.5 mt-1 text-inherit/80">
            <span className="w-3.5 sm:w-4 h-[1px] bg-current" />
            <span className="font-sans font-medium text-[8.5px] sm:text-[9px] tracking-[0.24em] uppercase">
              PRODUCT
            </span>
            <span className="w-3.5 sm:w-4 h-[1px] bg-current" />
          </div>
        </div>
      ),
    },
    {
      id: 'craft',
      name: 'CRAFT',
      origin: 'Chakwal Stone Cold Press',
      targetBrand: 'Chakwal Press',
      renderLogo: () => (
        <div className="flex flex-col items-center justify-center text-center">
          <span className="font-serif font-black text-[22px] sm:text-[25px] tracking-[0.14em] uppercase text-inherit leading-none">
            CRAFT
          </span>
        </div>
      ),
    },
  ];

  return (
    <section
      aria-label="Partner Brands and Certified Estates"
      className={`w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {/* =========================================================================
          SECTION HEADER: NAME, BADGE MOTIF & DESCRIPTION
          ========================================================================= */}
      {(title || description) && (
        <div className="text-center mb-8 sm:mb-10">
          {title && (
            <h2 className="text-[24px] sm:text-[30px] font-extrabold text-[#1F1F1F] uppercase tracking-wider mb-2.5">
              {title}
            </h2>
          )}

          {showBadge && (
            <div className="flex items-center justify-center gap-3 mb-3" aria-hidden="true">
              <span className="w-12 sm:w-20 h-[1.5px] bg-[#DDDDDD]" />
              <div className="w-8 h-8 rounded bg-[#15472B] text-white flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="w-12 sm:w-20 h-[1.5px] bg-[#DDDDDD]" />
            </div>
          )}

          {description && (
            <p className="text-[13px] sm:text-[14px] text-[#666666] max-w-[620px] mx-auto text-center leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}

      {/* =========================================================================
          EXACT 5-BOX BORDER-DIVIDED LOGO STRIP
          ========================================================================= */}
      <div className="w-full bg-white border border-[#E5E5E5] rounded-none shadow-none">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E5E5]">
          {partners.map((partner) => (
            <button
              key={partner.id}
              type="button"
              onClick={() => onSelectBrand?.(partner.targetBrand)}
              title={`${partner.name} - ${partner.origin} (Click to shop harvest)`}
              className="group h-[115px] sm:h-[130px] lg:h-[145px] flex flex-col items-center justify-center p-4 text-[#8A8A8A] hover:text-[#15472B] hover:bg-[#FBFBFA] transition-all duration-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#15472B]/30 relative"
            >
              {partner.renderLogo()}

              {/* Subtle hover tooltip showing origin / specialty */}
              <span className="absolute bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] text-[#788B23] font-semibold tracking-wider uppercase pointer-events-none">
                {partner.origin}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
});
