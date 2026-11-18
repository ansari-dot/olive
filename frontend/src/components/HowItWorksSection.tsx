import React, { useState } from 'react';

interface ProcessStep {
  id: string;
  line1: string;
  line2: string;
  detail: string;
  renderIcon: () => React.ReactNode;
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 'harvesting',
    line1: 'Harvesting',
    line2: 'Olives',
    detail:
      'Hand-picked at early veraison in the Potohar olive belt to capture peak aroma and natural polyphenols.',
    renderIcon: () => (
      <svg viewBox="0 0 64 64" className="w-[62px] h-[62px]" fill="none" aria-hidden="true">
        {/* Hand reaching from right */}
        <path
          d="M54 20H40C37.5 20 35.5 21.5 34.5 23.5L31 28.5C30.2 29.6 31.3 31 32.6 30.6L37 29.2"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M54 27.5H42.5C40.5 27.5 39 28.5 37.5 29.8L33.5 32.5C32.2 33.3 30.8 32 31.4 30.7"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M42.5 24.5H36.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        {/* Olive branch & hanging olives */}
        <path
          d="M14 29C21 30 28 29.5 34 28"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        {/* Leaves */}
        <path
          d="M21 29.5C18 24.5 14 23 11 24C13 27.5 16.5 29.5 21 29.5Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <path
          d="M29 29C31 24 34 22.5 37 23.5C35 27 32.5 29 29 29Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        {/* Three hanging olives */}
        <ellipse
          cx="18"
          cy="39.5"
          rx="4.2"
          ry="5.5"
          transform="rotate(-10 18 39.5)"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <ellipse
          cx="27.5"
          cy="44.5"
          rx="4"
          ry="5.4"
          transform="rotate(8 27.5 44.5)"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <ellipse
          cx="37"
          cy="39"
          rx="3.8"
          ry="5"
          transform="rotate(20 37 39)"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <path d="M19.5 30L18.5 34" stroke="currentColor" strokeWidth="1.2" />
        <path d="M26.5 29.5L27.2 39" stroke="currentColor" strokeWidth="1.2" />
        <path d="M33.5 28.5L35.8 34.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: 'processing',
    line1: 'Processing',
    line2: 'Olives',
    detail:
      'Washed in cool spring water and malaxed slowly below 27°C within six hours of harvest.',
    renderIcon: () => (
      <svg viewBox="0 0 64 64" className="w-[62px] h-[62px]" fill="none" aria-hidden="true">
        {/* Large olive */}
        <ellipse
          cx="25"
          cy="30"
          rx="8.5"
          ry="11"
          transform="rotate(-12 25 30)"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <path
          d="M22.5 22.5C21.5 25 21 28 21.5 31"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="round"
        />
        {/* Flanking olive leaves */}
        <path
          d="M23 19C17 15 11.5 16.5 9.5 19.5C13.5 22 18.5 22 23 19Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <path
          d="M27 19C32.5 15 38.5 16 40.5 19C36.5 21.5 31.5 21.5 27 19Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        {/* Crushing bowl / basin */}
        <path
          d="M31 37H53C53 45.5 47.5 50 42 50C36.5 50 31 45.5 31 37Z"
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path
          d="M35 37C37 33.5 40.5 32.5 43.5 33.5C46 34.3 48 35.5 49.5 37"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path d="M36 41.5H48" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'storage',
    line1: 'Storage of',
    line2: 'Olives',
    detail:
      'Stored in temperature-controlled, nitrogen-sealed stainless vats to protect freshness from light and oxygen.',
    renderIcon: () => (
      <svg viewBox="0 0 64 64" className="w-[62px] h-[62px]" fill="none" aria-hidden="true">
        {/* Burlap sack */}
        <path
          d="M17 26C15 32 14.5 41 16 48C16.5 49.5 18 50.5 20 50.5H39C41 50.5 42.5 49.5 43 48C44.5 41 44 32 42 26L44 20.5C44.5 19.2 43.5 18 42 18.5L36.5 20.5L32.5 17.5L28 20.5L22.5 18.5C21 18 20 19.2 20.5 20.5L22 25"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        {/* Sack cuff & fold */}
        <path
          d="M19 25.5C24 27 35 27 40 25.5"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        {/* Sack texture lines */}
        <path d="M20 33H27" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
        <path d="M20 37H25" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
        {/* Olives & leaves resting in front */}
        <ellipse
          cx="35"
          cy="38.5"
          rx="4.8"
          ry="6"
          transform="rotate(-15 35 38.5)"
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <ellipse
          cx="43.5"
          cy="44"
          rx="4.5"
          ry="5.5"
          transform="rotate(20 43.5 44)"
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <path
          d="M39 34C43 29.5 48.5 28 52 29.5C49.5 33.5 44.5 35 39 34Z"
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M42 36.5C47 36 51 37.5 53 40.5C49 41.5 44.5 40 42 36.5Z"
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'extra-virgin',
    line1: 'Extra Virgin',
    line2: 'Olive Oil',
    detail:
      'Bottled unfiltered in dark UV-shielded glass with verified free fatty acidity below 0.3%.',
    renderIcon: () => (
      <svg viewBox="0 0 64 64" className="w-[62px] h-[62px]" fill="none" aria-hidden="true">
        {/* Bottle cap & neck */}
        <rect x="23" y="13" width="8" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M24 17.5V23.5L20 28V49.5C20 50.3 20.7 51 21.5 51H32.5C33.3 51 34 50.3 34 49.5V28L30 23.5V17.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        {/* Bottle label */}
        <rect x="22.5" y="32" width="9" height="12" stroke="currentColor" strokeWidth="1.15" />
        {/* Olive & leaf beside bottle */}
        <ellipse
          cx="38"
          cy="45.5"
          rx="4.8"
          ry="6"
          transform="rotate(14 38 45.5)"
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <path
          d="M39 39.5C41.5 33.5 46 31 49.5 32C47.5 36.5 43.5 39 39 39.5Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <path
          d="M36 40C34.5 35.5 35.5 31 38 28.5C39.5 32 38.8 36.5 36 40Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'salad-dressing',
    line1: 'Salad Olive',
    line2: 'Dressing',
    detail:
      'Ideal as a raw finishing oil over garden greens, grilled vegetables, hummus, and warm flatbread.',
    renderIcon: () => (
      <svg viewBox="0 0 64 64" className="w-[62px] h-[62px]" fill="none" aria-hidden="true">
        {/* Salad bowl */}
        <path
          d="M17 37H47C46 45.5 39.5 50 32 50C24.5 50 18 45.5 17 37Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="M25 50H39" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        {/* Greens inside bowl */}
        <path
          d="M19.5 37C19.5 33.5 22.5 31.5 25.5 32.5C27.5 30.5 32 30.5 34.5 32.5C37.5 31 41.5 32 43.5 35C44.5 35.5 45 36.2 45 37"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="26" cy="34.5" r="1.4" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="37" cy="34.5" r="1.4" stroke="currentColor" strokeWidth="1.1" />
        {/* Pouring oil cruet top-right */}
        <path
          d="M36.5 21.5L44 14C45.5 12.5 48 12.5 49.5 14L51 15.5C52.5 17 52.5 19.5 51 21L43.5 28.5C42.2 29.8 40 29.8 38.7 28.5L36.5 26.3C35.2 25 35.2 22.8 36.5 21.5Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        {/* Handle & pouring spout */}
        <path
          d="M49 13.5C51.5 11.5 54 13 53 16"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <path
          d="M36 25.5L32.5 27.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        {/* Olive oil drop */}
        <path
          d="M31.5 29.5C31.5 29.5 30 31.5 30 32.5C30 33.3 30.7 34 31.5 34C32.3 34 33 33.3 33 32.5C33 31.5 31.5 29.5 31.5 29.5Z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
  {
    id: 'cosmetics',
    line1: 'Natural',
    line2: 'Cosmetics',
    detail:
      'Cold-pressed botanical lipids rich in squalene and vitamin E, also crafted for pure skin & hair care.',
    renderIcon: () => (
      <svg viewBox="0 0 64 64" className="w-[62px] h-[62px]" fill="none" aria-hidden="true">
        {/* Tall skincare tube */}
        <path
          d="M27 16H39L37.5 42H28.5L27 16Z"
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <rect x="29.5" y="42" width="7" height="5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M27.2 19.5H38.8" stroke="currentColor" strokeWidth="1.15" />
        {/* Small jar on left */}
        <path
          d="M15 35H27V45C27 46.2 26 47 24.8 47H17.2C16 47 15 46.2 15 45V35Z"
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <rect x="14.5" y="31.5" width="13" height="3.5" rx="0.8" fill="#ffffff" stroke="currentColor" strokeWidth="1.25" />
        {/* Olive sprig on right */}
        <ellipse
          cx="43.5"
          cy="43"
          rx="3.6"
          ry="4.8"
          transform="rotate(-15 43.5 43)"
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <path
          d="M42 38C44 33 48 31 51.5 32C49.5 35.5 46 38 42 38Z"
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M46 41C49 40 52 41 53.5 43.5C50.5 44.5 47.5 43.5 46 41Z"
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export const HowItWorksSection: React.FC = () => {
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const selectedStep = PROCESS_STEPS.find((step) => step.id === activeStepId);

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="w-full bg-[#F7F3EE] py-16 sm:py-20 lg:py-24"
    >
      <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Centered Heading & Subtitle */}
        <div className="text-center max-w-[640px] mx-auto mb-12 lg:mb-14">
          <h2
            id="how-it-works-heading"
            className="text-[32px] sm:text-[38px] lg:text-[42px] font-normal tracking-[-0.01em] text-[#111111] leading-tight"
          >
            How It Works
          </h2>
          <p className="mt-2.5 text-[14.5px] sm:text-[15px] text-[#6E6A66] font-normal leading-relaxed">
            From orchard harvest to cold-press extraction, every drop is handled with care.
          </p>
        </div>

        {/* 6-Step Horizontal Circle Process */}
        <div className="relative">
          {/* Connecting Hairline Behind Desktop Circles */}
          <div
            className="hidden lg:block absolute top-[72px] left-[8%] right-[8%] h-[1px] bg-[#E2DDD6] z-0"
            aria-hidden="true"
          />

          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-10 gap-x-5">
            {PROCESS_STEPS.map((step) => {
              const isSelected = activeStepId === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() =>
                    setActiveStepId((prev) => (prev === step.id ? null : step.id))
                  }
                  aria-pressed={isSelected}
                  className="group flex flex-col items-center text-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#15472B]"
                >
                  <span
                    className={`w-[132px] h-[132px] xl:w-[144px] xl:h-[144px] rounded-full bg-white flex items-center justify-center text-[#1C1C1C] transition-all duration-200 group-hover:-translate-y-1 ${
                      isSelected
                        ? 'ring-2 ring-[#7D9225] shadow-[0_6px_20px_rgba(0,0,0,0.06)]'
                        : 'shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                    }`}
                  >
                    {step.renderIcon()}
                  </span>

                  <span className="mt-4 text-[14.5px] sm:text-[15px] leading-[1.35] text-[#262626] font-normal group-hover:text-[#15472B] transition-colors">
                    {step.line1}
                    <br />
                    {step.line2}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quiet Inline Detail Line When a Stage Is Clicked */}
        {selectedStep && (
          <div className="mt-10 pt-6 border-t border-[#E6E0D8] max-w-[680px] mx-auto text-center">
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#7D9225] font-semibold">
              {selectedStep.line1} {selectedStep.line2}
            </p>
            <p className="mt-1.5 text-[14.5px] text-[#4A4744] leading-relaxed">
              {selectedStep.detail}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
