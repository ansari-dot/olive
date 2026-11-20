import React, { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Product } from '../data/storeData';

interface DealsSectionProps {
  spotlightDeal: Product;
  deals: Product[];
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

const formatPKR = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

const StarRating: React.FC<{ rating?: number }> = ({ rating = 5 }) => (
  <div className="flex items-center justify-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((star) => {
      const filled = star <= rating;
      return (
        <svg
          key={star}
          viewBox="0 0 16 16"
          className="w-[12px] h-[12px] text-[#C46B3B]"
          fill={filled ? 'currentColor' : 'none'}
          aria-hidden="true"
        >
          <path
            d="M8 1.4L9.95 5.35L14.3 5.98L11.15 9.05L11.89 13.38L8 11.33L4.11 13.38L4.85 9.05L1.7 5.98L6.05 5.35L8 1.4Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    })}
  </div>
);

export const DealsSection: React.FC<DealsSectionProps> = ({
  spotlightDeal,
  deals,
  onAddToCart,
  onSelectProduct,
}) => {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (spotlightDeal?.dealEndsAt) {
      const diff = Math.max(0, Math.floor((new Date(spotlightDeal.dealEndsAt).getTime() - Date.now()) / 1000));
      return diff > 0 ? diff : 2 * 86400 + 14 * 3600;
    }
    return 2 * 86400 + 14 * 3600 + 38 * 60 + 19;
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);
  const secs = secondsLeft % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  const spotlightSavings = spotlightDeal.originalPrice
    ? spotlightDeal.originalPrice - spotlightDeal.price
    : 0;

  return (
    <section
      id="deals-section"
      aria-labelledby="harvest-deals-heading"
      className="w-full bg-white py-16 sm:py-20 lg:py-24"
    >
      <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Centered Editorial Heading + Minimal Harvest Timer */}
        <div className="text-center max-w-[660px] mx-auto mb-12 lg:mb-14">
          <h2
            id="harvest-deals-heading"
            className="text-[32px] sm:text-[38px] lg:text-[42px] font-normal tracking-[-0.01em] text-[#111111] leading-tight"
          >
            Seasonal Harvest Deals
          </h2>
          <p className="mt-2.5 text-[14.5px] sm:text-[15px] text-[#6E6A66] font-normal leading-relaxed">
            Direct-from-orchard pantry bundles, 5-litre heritage kitchen tins, and early-harvest savings across Pakistan.
          </p>

          {/* Subtle Editorial Countdown */}
          <div className="mt-5 inline-flex items-center gap-4 text-[12.5px] text-[#5F5B57] tracking-[0.06em] uppercase tabular-nums">
            <span>Harvest Offer Ends In</span>
            <span className="h-3.5 w-[1px] bg-[#D6CFC5]" aria-hidden="true" />
            <span className="font-semibold text-[#15472B]">
              {pad(days)}d : {pad(hours)}h : {pad(mins)}m : {pad(secs)}s
            </span>
          </div>
        </div>

        {/* Borderless Editorial Split Spotlight Deal */}
        <article className="bg-[#FAF4ED] grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          <div className="lg:col-span-6 relative bg-[#FAF3F0] aspect-[4/3] lg:aspect-auto lg:min-h-[390px] overflow-hidden group">
            <span className="absolute top-0 left-0 z-10 bg-[#C46B3B] text-white text-[12px] font-medium leading-none px-4 py-2.5 tracking-[0.03em]">
              {spotlightDeal.dealBadge ?? spotlightDeal.tag ?? 'Sale'}
            </span>

            {!brokenImages[spotlightDeal.id] ? (
              <button
                type="button"
                onClick={() => onSelectProduct(spotlightDeal)}
                className="w-full h-full block cursor-pointer"
              >
                <img
                  src={spotlightDeal.image}
                  alt={spotlightDeal.name}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setBrokenImages((prev) => ({ ...prev, [spotlightDeal.id]: true }))
                  }
                  className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />
              </button>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-8 text-center text-[#15472B]">
                <span className="font-serif-brand text-xl">{spotlightDeal.name}</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-6 px-7 py-9 sm:px-12 sm:py-12 flex flex-col justify-center">
            <p className="text-[11.5px] uppercase tracking-[0.15em] text-[#C46B3B] font-semibold">
              Limited Harvest Bundle · {spotlightDeal.size}
            </p>
            <h3 className="mt-2.5 font-serif-brand text-[26px] sm:text-[32px] text-[#15472B] font-normal leading-[1.2]">
              <button
                type="button"
                onClick={() => onSelectProduct(spotlightDeal)}
                className="text-left hover:underline underline-offset-4 decoration-1 cursor-pointer"
              >
                {spotlightDeal.name}
              </button>
            </h3>

            <p className="mt-4 text-[14.5px] leading-[1.72] text-[#666666] max-w-[46ch]">
              {spotlightDeal.description}
            </p>

            {/* Clean Typographic Pricing Row */}
            <div className="mt-6 flex flex-wrap items-baseline gap-3.5 tabular-nums">
              {spotlightDeal.originalPrice && (
                <span className="text-[17px] text-[#888888] line-through">
                  {formatPKR(spotlightDeal.originalPrice)}
                </span>
              )}
              <span className="text-[24px] font-semibold text-[#C46B3B]">
                {formatPKR(spotlightDeal.price)}
              </span>
              {spotlightSavings > 0 && (
                <span className="text-[13px] text-[#15472B] font-medium">
                  · Save {formatPKR(spotlightSavings)} &amp; Free Delivery
                </span>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => onAddToCart(spotlightDeal)}
                className="bg-[#788B23] hover:bg-[#65761B] text-white text-[12px] font-semibold uppercase tracking-[0.12em] px-8 py-3.5 inline-flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15472B]"
              >
                <ShoppingCart className="w-3.5 h-3.5 stroke-[2]" />
                <span>ADD DEAL TO BAG</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectProduct(spotlightDeal)}
                className="text-[12px] uppercase tracking-[0.12em] font-semibold text-[#1C1C1C] hover:text-[#C46B3B] underline underline-offset-4 transition-colors cursor-pointer"
              >
                View Bundle Details
              </button>
            </div>
          </div>
        </article>

        {/* 4-Column Borderless Deal Cards Directly on #F7F3EE */}
        <div className="mt-12 lg:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
          {deals.map((deal) => {
            const isBroken = brokenImages[deal.id];

            return (
              <article key={deal.id} className="group flex flex-col">
                <div className="relative aspect-[3/3.55] w-full bg-[#FAF3F0] overflow-hidden">
                  <span className="absolute top-0 left-0 z-10 bg-[#C46B3B] text-white text-[12px] font-medium leading-none px-3.5 py-2 tracking-[0.02em] tabular-nums">
                    {deal.tag ?? 'Sale'}
                  </span>

                  {!isBroken ? (
                    <button
                      type="button"
                      onClick={() => onSelectProduct(deal)}
                      className="w-full h-full block cursor-pointer"
                    >
                      <img
                        src={deal.image}
                        alt={deal.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [deal.id]: true }))
                        }
                        className="w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                      />
                    </button>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 text-center text-[#15472B]">
                      <span className="font-serif-brand text-lg">{deal.name}</span>
                    </div>
                  )}

                  {/* Quick Add Bar on Hover/Focus */}
                  <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200 z-10">
                    <button
                      type="button"
                      onClick={() => onAddToCart(deal)}
                      className="w-full py-2.5 bg-[#1C1C1C]/90 hover:bg-[#788B23] text-white text-[11.5px] uppercase tracking-[0.09em] font-medium transition-colors cursor-pointer"
                    >
                      Add to Bag
                    </button>
                  </div>
                </div>

                {/* Centered Clean Typography Directly on #F7F3EE */}
                <div className="mt-4 text-center">
                  <h3 className="text-[16.5px] sm:text-[17px] font-normal text-[#1E1E1E] leading-snug">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(deal)}
                      className="hover:text-[#15472B] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15472B]"
                    >
                      {deal.name}
                    </button>
                  </h3>

                  <div className="mt-1.5">
                    <StarRating rating={deal.rating ?? 5} />
                  </div>

                  <div className="mt-1.5 flex items-center justify-center gap-2 text-[14px] tabular-nums">
                    {deal.originalPrice && (
                      <span className="text-[#777777] line-through">
                        {formatPKR(deal.originalPrice)}
                      </span>
                    )}
                    <span className="text-[#C46B3B] font-medium">
                      {formatPKR(deal.price)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
