import React, { useState } from 'react';
import { BrandItem } from '../data/storeData';
import storyBottleSketch from '../assets/images/story_olive_bottle_sketch_1794767970544.jpg';

interface AboutUsPageProps {
  brands: BrandItem[];
  onNavigateHome: () => void;
  onNavigateShop: (brandName?: string) => void;
  onNavigateContact: () => void;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({
  brands,
  onNavigateHome,
  onNavigateShop,
  onNavigateContact,
}) => {
  const [imgError, setImgError] = useState(false);

  const pillars = [
    {
      metric: '< 27°C',
      title: 'Cold-Pressed Extraction',
      detail:
        'First mechanical press within six hours of harvest so natural antioxidants and delicate aroma remain intact.',
    },
    {
      metric: '< 0.3%',
      title: 'Verified Free Acidity',
      detail:
        'Every Potohar and Swat lot undergoes laboratory screening well below the international 0.8% extra virgin limit.',
    },
    {
      metric: '100%',
      title: 'Single-Origin Traceability',
      detail:
        'Sourced directly from partner orchards across Chakwal, Potohar, and Swat with zero blended imports or solvents.',
    },
  ];

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
          <span className="text-[#444444]">About Us</span>
        </nav>

        {/* Main 2-Column Editorial Story */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Studio Frame */}
          <div className="lg:col-span-5">
            <div className="aspect-[3/3.45] w-full bg-[#FAF3F0] flex items-center justify-center p-8 overflow-hidden">
              {!imgError ? (
                <img
                  src={storyBottleSketch}
                  alt="Botanical pen-and-ink illustration of Zaitoon Pakistan olive oil bottle"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain mix-blend-multiply contrast-125"
                />
              ) : (
                <span className="font-serif-brand text-xl text-[#15472B]">
                  Zaitoon Pakistan
                </span>
              )}
            </div>
          </div>

          {/* Right Narrative */}
          <div className="lg:col-span-7">
            <p className="text-[11.5px] uppercase tracking-[0.12em] text-[#C46B3B] font-semibold mb-2">
              Potohar &amp; Swat Orchard Heritage
            </p>
            <h1 className="text-[30px] sm:text-[36px] font-normal text-[#181818] leading-tight">
              Pure Cold-Pressed Nourishment From Pakistan’s Olive Belt
            </h1>

            <div className="mt-5 space-y-4 text-[14.5px] leading-[1.75] text-[#555555]">
              <p>
                Founded with a commitment to pure, unrefined nourishment, Zaitoon Pakistan brings
                together small-batch olive oil producers, mountain apiaries, and botanical growers
                across Pakistan. From the sun-drenched limestone slopes of Chakwal and the Potohar
                olive belt to the wild valleys of Swat and Karak, every harvest is selected at peak
                ripeness and cold-pressed below 27°C within hours of picking.
              </p>
              <p>
                Unlike mass-refined commercial blends, our extra virgin olive oils, raw unfiltered
                Sidr honeys, and sun-dried olive leaf infusions remain completely free of chemical
                solvents, artificial preservatives, and heat pasteurization.
              </p>
            </div>

            {/* Key Metrics Strip */}
            <div className="mt-7 pt-6 pb-6 border-t border-b border-[#EAEAEA] grid grid-cols-3 gap-6 tabular-nums">
              <div>
                <p className="text-[20px] sm:text-[22px] font-normal text-[#181818]">&lt; 27°C</p>
                <p className="text-[12px] text-[#666666] mt-0.5">Cold Extraction</p>
              </div>
              <div>
                <p className="text-[20px] sm:text-[22px] font-normal text-[#181818]">&lt; 0.3%</p>
                <p className="text-[12px] text-[#666666] mt-0.5">Natural Acidity</p>
              </div>
              <div>
                <p className="text-[20px] sm:text-[22px] font-normal text-[#181818]">100%</p>
                <p className="text-[12px] text-[#666666] mt-0.5">Single-Origin</p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigateShop('All Brands')}
                className="bg-[#0B0B0B] hover:bg-[#15472B] text-white text-[11.5px] font-semibold uppercase tracking-[0.09em] px-8 py-3.5 transition-colors cursor-pointer"
              >
                EXPLORE SHOP
              </button>
              <button
                type="button"
                onClick={onNavigateContact}
                className="border border-[#181818] bg-white hover:bg-[#181818] hover:text-white text-[#181818] text-[11.5px] font-semibold uppercase tracking-[0.09em] px-7 py-3.5 transition-colors cursor-pointer"
              >
                CONTACT US
              </button>
            </div>
          </div>
        </div>

        {/* Quality Standards Row */}
        <section aria-labelledby="quality-standards-heading" className="mt-16 pt-12 border-t border-[#EAEAEA]">
          <h2
            id="quality-standards-heading"
            className="text-[24px] sm:text-[28px] font-normal text-[#181818] mb-7"
          >
            Our Quality Standards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {pillars.map((item) => (
              <div key={item.title} className="bg-[#FAF3F0] p-7">
                <p className="text-[24px] font-normal text-[#C46B3B] tabular-nums">{item.metric}</p>
                <h3 className="mt-2 text-[17px] font-normal text-[#181818]">{item.title}</h3>
                <p className="mt-2.5 text-[13.5px] leading-[1.68] text-[#555555]">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Partner Estates */}
        <section aria-labelledby="partner-estates-heading" className="mt-14 pt-12 border-t border-[#EAEAEA]">
          <h2
            id="partner-estates-heading"
            className="text-[24px] sm:text-[28px] font-normal text-[#181818] mb-7"
          >
            Partner Groves &amp; Apiaries
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="border border-[#EAEAEA] bg-white p-6 flex flex-col justify-between"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.09em] text-[#C46B3B] font-semibold">
                    {brand.origin}
                  </p>
                  <h3 className="mt-1.5 text-[17.5px] font-normal text-[#181818]">
                    {brand.name}
                  </h3>
                  <p className="mt-2 text-[13px] leading-[1.65] text-[#666666]">
                    {brand.specialty}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateShop(brand.name)}
                  className="mt-5 self-start text-[11.5px] uppercase tracking-[0.08em] font-semibold text-[#181818] hover:text-[#C46B3B] transition-colors cursor-pointer"
                >
                  Shop Harvest &rarr;
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};
