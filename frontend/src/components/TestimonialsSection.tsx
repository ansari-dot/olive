import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

interface TestimonialCardData {
  id: string;
  quote: string;
  author: string;
  role?: string;
  avatar: string;
  rating: number;
}

const TESTIMONIAL_SETS: TestimonialCardData[][] = [
  [
    {
      id: 'rev-1',
      quote:
        'Far exceeded expectations. The aroma of freshly cold-crushed green olives hits the moment you uncork the bottle. We drizzle Potohar Reserve over warm naan every morning—nothing supermarket-bought comes close.',
      author: 'Ayesha Siddiqui',
      role: 'Islamabad, Pakistan',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 5,
    },
    {
      id: 'rev-2',
      quote:
        'Ordered the Raw Himalayan Sidr Honeycomb alongside Chakwal olive oil for my parents. Clean wax seal packaging, pristine glass bottle, and delivered right on time. Purest artisanal quality in Pakistan.',
      author: 'Hamza Tariq',
      role: 'Lahore, Pakistan',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      rating: 5,
    },
    {
      id: 'rev-3',
      quote:
        'The Olive Leaf & Highland Lemongrass tea has become our nightly ritual. Light herbal finish with zero bitterness, and knowing it comes straight from northern groves makes it truly therapeutic.',
      author: 'Dr. Sana Mahmood',
      role: 'Karachi, Pakistan',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      rating: 5,
    },
  ],
  [
    {
      id: 'rev-4',
      quote:
        'Clean peppery finish at the back of the throat—the unmistakable hallmark of genuine early harvest cold-pressed oil. We switched our entire kitchen over to Pak Veda estate reserves.',
      author: 'Bilal Qureshi',
      role: 'Rawalpindi, Pakistan',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      rating: 5,
    },
    {
      id: 'rev-5',
      quote:
        'Gifted the Kashmiri Saffron & Peppercorn oil and Castile olive soap set to family in Peshawar. Unmatched natural fragrance and thoughtful glass apothecary presentation.',
      author: 'Zainab Afridi',
      role: 'Peshawar, Pakistan',
      avatar:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      rating: 5,
    },
    {
      id: 'rev-6',
      quote:
        'Consistent quality batch after batch. Even the cured green and Kalamata olives taste firm, mineral-rich, and cleanly brined without harsh commercial vinegar.',
      author: 'Faisal Malik',
      role: 'Multan, Pakistan',
      avatar:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      rating: 5,
    },
  ],
];

export const TestimonialsSection: React.FC = () => {
  const [activeSet, setActiveSet] = useState(0);
  const currentReviews = TESTIMONIAL_SETS[activeSet];

  return (
    <section
      id="testimonials"
      aria-label="What They Say - Customer Reviews"
      className="relative w-full bg-[#111512] bg-gradient-to-b from-[#0F1410] via-[#141A16] to-[#0F1410] py-16 sm:py-20 lg:py-24 overflow-hidden"
    >
      {/* Dark Ambient Botanical Grove Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-luminosity pointer-events-none"
        style={{
          backgroundImage: 'url(/assets/images/hero_zaitoon_olive_grove_1794763964188.jpg)',
        }}
      />

      <div className="relative z-10 max-w-[1240px] xl:max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* =========================================================================
            HEADER: "WHAT THEY SAY" + RED SHOPPING BAG BADGE WITH FLANKING WHITE RULES
            (Exact Match to Reference Screenshot)
            ========================================================================= */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-[22px] sm:text-[26px] lg:text-[28px] font-black uppercase tracking-[0.08em] text-white leading-none">
            What They Say
          </h2>

          {/* Brand Shopping Bag Badge with Flanking Horizontal Lines */}
          <div className="flex items-center justify-center gap-3 mt-3.5">
            <div className="w-10 sm:w-16 h-[1.5px] bg-white/30" />
            <div className="w-6 h-6 rounded-2xs bg-[#15472B] border border-white/20 flex items-center justify-center text-white shadow-xs select-none shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div className="w-10 sm:w-16 h-[1.5px] bg-white/30" />
          </div>
        </div>

        {/* =========================================================================
            3-COLUMN CARD GRID: LEFT (LIGHT), CENTER (VIBRANT RED), RIGHT (LIGHT)
            (Exact Match to Reference Screenshot)
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {currentReviews.map((item, index) => {
            const isCenter = index === 1;

            return (
              <article
                key={item.id}
                className={`relative flex flex-col items-center justify-between text-center p-7 sm:p-9 rounded-2xs shadow-xl transition-all duration-300 hover:-translate-y-1.5 select-none ${
                  isCenter
                    ? 'bg-[#15472B] bg-gradient-to-b from-[#185332] to-[#113C23] text-white border border-[#276B42] shadow-2xl'
                    : 'bg-[#F9F9F9] text-[#111111] border border-white/20'
                }`}
                style={{ minHeight: '380px' }}
              >
                {/* Top: Large Classical Double Quotes Icon */}
                <div className="pt-2">
                  <svg
                    className={`w-10 h-8 ${
                      isCenter ? 'text-white/35 fill-white/35' : 'text-[#15472B]/20 fill-[#15472B]/20'
                    }`}
                    viewBox="0 0 32 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M0 14.4C0 6.4 5.2 1.2 12.8 0L14 3.2C8.8 4.4 6.4 7.2 6 10.4H12V24H0V14.4ZM18 14.4C18 6.4 23.2 1.2 30.8 0L32 3.2C26.8 4.4 24.4 7.2 24 10.4H30V24H18V14.4Z" />
                  </svg>
                </div>

                {/* Middle: Centered Review Prose */}
                <div className="my-5 flex-1 flex items-center justify-center">
                  <p
                    className={`text-[13px] sm:text-[13.5px] leading-[1.7] max-w-[280px] mx-auto ${
                      isCenter ? 'text-white font-normal' : 'text-[#4B5563] font-normal'
                    }`}
                  >
                    {item.quote}
                  </p>
                </div>

                {/* Bottom Meta: 5 Gold Stars, Centered Circular Avatar, Bold Author Name */}
                <div className="flex flex-col items-center justify-center w-full">
                  {/* 5 Gold Stars */}
                  <div
                    className="flex items-center justify-center gap-0.5 text-[#F59E0B] mb-4"
                    aria-label={`Rated ${item.rating} out of 5 stars`}
                  >
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg
                        key={s}
                        viewBox="0 0 16 16"
                        className="w-3.5 h-3.5 fill-[#F59E0B]"
                      >
                        <path d="M8 1.4L9.95 5.35L14.3 5.98L11.15 9.05L11.89 13.38L8 11.33L4.11 13.38L4.85 9.05L1.7 5.98L6.05 5.35L8 1.4Z" />
                      </svg>
                    ))}
                  </div>

                  {/* Centered Circular Portrait Avatar */}
                  <div className="relative mb-2.5">
                    <img
                      src={item.avatar}
                      alt={item.author}
                      className={`w-12 h-12 rounded-full object-cover shadow-sm ${
                        isCenter ? 'ring-2 ring-white' : 'ring-1 ring-[#E5E7EB]'
                      }`}
                    />
                  </div>

                  {/* Author Name */}
                  <h3
                    className={`text-[14.5px] sm:text-[15px] font-bold leading-tight ${
                      isCenter ? 'text-white' : 'text-[#111111]'
                    }`}
                  >
                    {item.author}
                  </h3>
                </div>
              </article>
            );
          })}
        </div>

        {/* Carousel Pagination Dots */}
        {TESTIMONIAL_SETS.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {TESTIMONIAL_SETS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSet(i)}
                aria-label={`Show testimonial page ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  activeSet === i ? 'bg-[#788B23] w-6' : 'bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
