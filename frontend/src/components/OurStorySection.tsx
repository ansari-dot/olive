import React, { useState } from 'react';
import storyBottleSketch from '../assets/images/story_olive_bottle_sketch_1794767970544.jpg';

export const OurStorySection: React.FC = React.memo(() => {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <section
      id="our-story"
      aria-labelledby="our-story-heading"
      className="w-full bg-white py-16 sm:py-20 lg:py-24"
    >
      <div className="max-w-[1160px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Centered Serif Heading + Ornamental Knot Divider */}
        <div className="text-center mb-12 lg:mb-14">
          <h2
            id="our-story-heading"
            className="text-[#15472B] text-[34px] sm:text-[40px] lg:text-[44px] font-bold leading-tight tracking-[-0.01em]"
            style={{ fontFamily: "Georgia, 'Playfair Display', 'Times New Roman', serif" }}
          >
            Our Story
          </h2>

          {/* Ornamental interlaced botanical divider matching reference */}
          <div className="mt-2.5 flex justify-center" aria-hidden="true">
            <svg
              viewBox="0 0 180 18"
              className="w-[160px] h-[16px] text-[#1B5734]"
              fill="none"
            >
              <line x1="6" y1="9" x2="70" y2="9" stroke="currentColor" strokeWidth="1.1" />
              <line x1="110" y1="9" x2="174" y2="9" stroke="currentColor" strokeWidth="1.1" />
              <path
                d="M72 9L80 4.5L90 13.5L100 4.5L108 9L100 13.5L90 4.5L80 13.5L72 9Z"
                stroke="currentColor"
                strokeWidth="1.15"
                strokeLinejoin="round"
              />
              <path
                d="M84 9L90 3L96 9L90 15L84 9Z"
                stroke="currentColor"
                strokeWidth="1.05"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Brand Story Copy + Right-Aligned Olive CTA */}
          <div className="lg:col-span-7">
            <div className="space-y-5 text-[14.5px] sm:text-[15px] leading-[1.72] text-[#666666]">
              <p>
                Founded with a commitment to pure, unrefined nourishment, Pak Veda brings
                together master small-batch spice millers, cold-pressed olive growers, mountain apiaries,
                and high-altitude botanical foragers across Pakistan. From the sun-drenched limestone slopes
                of Chakwal and the Potohar olive belt to the pristine glaciers of Skardu and the spice bazaars
                of Lahore, every harvest is sourced at peak potency.
              </p>
              <p>
                Spanning 28 master product categories—from cold-milled ground spices and single-cultivar
                extra virgin olive oils to wild Himalayan Shilajit, Lion's Mane mushroom concentrates, and raw
                Sidr honey—every batch remains 100% unadulterated, unrefined, and lab-tested for absolute purity.
              </p>
            </div>

            {/* Expanded Harvest Standards (toggled by READ MORE) */}
            {expanded && (
              <div className="mt-6 pt-6 border-t border-[#EAEAEA] grid grid-cols-1 sm:grid-cols-3 gap-6 tabular-nums">
                <div>
                  <p className="text-[11.5px] uppercase tracking-[0.08em] text-[#7D9225] font-semibold">
                    Extraction
                  </p>
                  <p className="text-[15px] font-semibold text-[#15472B] mt-0.5">
                    Cold-Pressed &lt; 27°C
                  </p>
                  <p className="text-[13px] text-[#666666] mt-1">
                    First mechanical press within 6 hours of harvest.
                  </p>
                </div>
                <div>
                  <p className="text-[11.5px] uppercase tracking-[0.08em] text-[#7D9225] font-semibold">
                    Purity Metric
                  </p>
                  <p className="text-[15px] font-semibold text-[#15472B] mt-0.5">
                    Acidity &lt; 0.3%
                  </p>
                  <p className="text-[13px] text-[#666666] mt-1">
                    Verified extra virgin grade with rich polyphenols.
                  </p>
                </div>
                <div>
                  <p className="text-[11.5px] uppercase tracking-[0.08em] text-[#7D9225] font-semibold">
                    Traceability
                  </p>
                  <p className="text-[15px] font-semibold text-[#15472B] mt-0.5">
                    100% Single-Origin
                  </p>
                  <p className="text-[13px] text-[#666666] mt-1">
                    Sourced directly from Potohar, Swat, and Karak estates.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                className="inline-flex items-center justify-center bg-[#7D9225] hover:bg-[#6A7D1D] text-white text-[12px] font-semibold uppercase tracking-[0.09em] px-8 py-3.5 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15472B]"
              >
                {expanded ? 'SHOW LESS' : 'READ MORE'}
              </button>
            </div>
          </div>

          {/* Right Column: Pen-and-Ink Olive Bottle Botanical Illustration */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
            <div className="w-[270px] sm:w-[310px] lg:w-[340px] aspect-square bg-white flex items-center justify-center overflow-hidden">
              {!imgError ? (
                <img
                  src={storyBottleSketch}
                  alt="Pen-and-ink botanical illustration of an olive oil bottle surrounded by olive leaves and whole olives"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain mix-blend-multiply contrast-125 [clip-path:inset(2%_11%_2%_11%)]"
                />
              ) : (
                <svg
                  viewBox="0 0 200 240"
                  className="w-48 h-56 text-[#222222]"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect x="74" y="24" width="52" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M84 42V66L66 90V202C66 206 70 210 74 210H126C130 210 134 206 134 202V90L116 66V42"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <ellipse cx="76" cy="208" rx="14" ry="10" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" />
                  <ellipse cx="122" cy="208" rx="15" ry="11" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
