import React from 'react';

interface ZaitoonLogoProps {
  onClick?: () => void;
  className?: string;
  variant?: 'light' | 'dark';
}

export const ZaitoonLogo: React.FC<ZaitoonLogoProps> = ({
  onClick,
  className = '',
  variant = 'light',
}) => {
  const isDark = variant === 'dark';

  return (
    <a
      href="#home"
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label="Zaitoon Pakistan Home"
      className={`group inline-flex flex-col items-center justify-center ${
        isDark ? 'bg-transparent' : 'bg-white'
      } select-none shrink-0 transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#224d26] ${className}`}
    >
      {/* Botanical dual-leaf emblem */}
      <svg
        viewBox="0 0 84 44"
        className="w-[58px] h-[30px] mb-[2px] overflow-visible"
        fill="none"
        aria-hidden="true"
      >
        {/* Back light-green leaf tilted left */}
        <path
          d="M37 25C30 22 25 14 23 3C34 5 41 12 42 23C40.5 24 38.8 24.7 37 25Z"
          fill={isDark ? '#98D45C' : '#7CC242'}
        />
        <path
          d="M27.5 8.5C31.5 13 35 18 38.2 23.5"
          stroke={isDark ? '#143320' : '#FFFFFF'}
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Front dark-green leaf tilted right with curved stem */}
        <path
          d="M36 27C37 16 45 7 60 6C59 19 50 28 38 28.5C34 31 30.5 34.5 28.5 39.5C27.5 35.5 30.5 30.5 36 27Z"
          fill={isDark ? '#4F9A48' : '#1D5A2A'}
        />
        {/* Inner leaf rib highlight */}
        <path
          d="M54 10.5C47 14.5 41.5 20.5 36.5 27.5"
          stroke="#FFFFFF"
          strokeWidth="1.05"
          strokeLinecap="round"
          opacity="0.92"
        />
      </svg>

      {/* Top crisp olive rule */}
      <span
        className={`w-[106px] h-[1.25px] block ${
          isDark ? 'bg-[#98D45C]/80' : 'bg-[#8BC34A]'
        }`}
        aria-hidden="true"
      />

      {/* Brand Wordmark */}
      <span
        className={`mt-[4px] text-[17.5px] font-bold leading-[1.02] tracking-[0.02em] uppercase whitespace-nowrap ${
          isDark ? 'text-white' : 'text-[#224D26]'
        }`}
        style={{ fontFamily: "Georgia, 'Playfair Display', 'Times New Roman', serif" }}
      >
        ZAITOON
      </span>
      <span
        className={`mt-[1px] mb-[4px] text-[14.5px] font-normal leading-[1.04] tracking-[0.075em] uppercase whitespace-nowrap ${
          isDark ? 'text-[#A8DC72]' : 'text-[#77B83F]'
        }`}
        style={{ fontFamily: "Georgia, 'Playfair Display', 'Times New Roman', serif" }}
      >
        PAKISTAN
      </span>

      {/* Bottom crisp olive rule */}
      <span
        className={`w-[106px] h-[1.25px] block ${
          isDark ? 'bg-[#98D45C]/80' : 'bg-[#8BC34A]'
        }`}
        aria-hidden="true"
      />
    </a>
  );
};
