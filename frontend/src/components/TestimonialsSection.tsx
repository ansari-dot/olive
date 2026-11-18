import React, { useState } from 'react';

interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  city: string;
  product: string;
  rating: number;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'test-1',
    quote:
      'You smell fresh crushed green olives the second you uncork the bottle. We drizzle Potohar Reserve over hummus and warm naan every morning—nothing supermarket-bought comes close.',
    author: 'Ayesha Siddiqui',
    city: 'Islamabad',
    product: 'Potohar Harvest Reserve',
    rating: 5,
  },
  {
    id: 'test-2',
    quote:
      'Ordered the Raw Himalayan Sidr Honeycomb alongside Chakwal olive oil for my parents in Lahore. Clean wax seal packaging, crisp glass bottle, and delivered right on time.',
    author: 'Hamza Tariq',
    city: 'Lahore',
    product: 'Wild Himalayan Sidr Honey',
    rating: 5,
  },
  {
    id: 'test-3',
    quote:
      'The Olive Leaf & Highland Lemongrass tea has become our nightly ritual. Light herbal finish with zero bitterness, and knowing it comes straight from Swat orchards makes it even better.',
    author: 'Dr. Sana Mahmood',
    city: 'Karachi',
    product: 'Olive Leaf Botanical Tea',
    rating: 5,
  },
  {
    id: 'test-4',
    quote:
      'Clean peppery finish at the back of the throat—classic sign of genuine early cold-pressed oil. We switched our entire kitchen over to Zaitoon Pakistan’s estate bottles.',
    author: 'Bilal Qureshi',
    city: 'Rawalpindi',
    product: 'The Estate Blend',
    rating: 5,
  },
  {
    id: 'test-5',
    quote:
      'Gifted the Kashmiri Saffron & Peppercorn oil and Castile olive soap set to family in Peshawar. Unmatched fragrance and thoughtful glass apothecary presentation.',
    author: 'Zainab Afridi',
    city: 'Peshawar',
    product: 'Saffron & Peppercorn Reserve',
    rating: 5,
  },
  {
    id: 'test-6',
    quote:
      'Consistent quality batch after batch. Even the cured green and Kalamata olives taste firm, mineral-rich, and cleanly brined without harsh vinegar.',
    author: 'Faisal Malik',
    city: 'Multan',
    product: 'Alfonso Orchard Olives',
    rating: 5,
  },
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        viewBox="0 0 16 16"
        className="w-[12px] h-[12px] text-[#C46B3B]"
        fill={star <= rating ? 'currentColor' : 'none'}
        aria-hidden="true"
      >
        <path
          d="M8 1.4L9.95 5.35L14.3 5.98L11.15 9.05L11.89 13.38L8 11.33L4.11 13.38L4.85 9.05L1.7 5.98L6.05 5.35L8 1.4Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    ))}
  </div>
);

export const TestimonialsSection: React.FC = () => {
  const [page, setPage] = useState(0);
  const pageCount = 2;
  const visible = TESTIMONIALS.slice(page * 3, page * 3 + 3);

  const handlePrev = () => setPage((prev) => (prev - 1 + pageCount) % pageCount);
  const handleNext = () => setPage((prev) => (prev + 1) % pageCount);

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="w-full bg-[#FAF4ED] py-16 sm:py-20 lg:py-24"
    >
      <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Centered Header Matching How It Works / From Our Blog */}
        <div className="text-center max-w-[640px] mx-auto mb-12 lg:mb-14">
          <h2
            id="testimonials-heading"
            className="text-[32px] sm:text-[38px] lg:text-[42px] font-normal tracking-[-0.01em] text-[#111111] leading-tight"
          >
            What Our Customers Say
          </h2>
          <p className="mt-2.5 text-[14.5px] sm:text-[15px] text-[#6E6A66] font-normal leading-relaxed">
            Honest notes from Pakistani kitchens and families enjoying cold-pressed Potohar harvests.
          </p>
        </div>

        {/* 3-Column Editorial Quote Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 lg:gap-8">
          {visible.map((item) => (
            <article
              key={item.id}
              className="bg-white p-8 sm:p-9 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-5">
                  <StarRating rating={item.rating} />
                  <span className="text-[11px] uppercase tracking-[0.11em] text-[#788B23] font-semibold">
                    {item.product}
                  </span>
                </div>

                <blockquote className="font-serif-brand text-[17px] sm:text-[18px] leading-[1.7] text-[#1D1D1D] font-normal">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
              </div>

              <div className="mt-7 pt-5 border-t border-[#E6DDD0] flex items-center justify-between gap-2">
                <div>
                  <p className="text-[14.5px] font-semibold text-[#15472B]">
                    {item.author}
                  </p>
                  <p className="text-[12.5px] text-[#6E6A66]">{item.city}, Pakistan</p>
                </div>
                <span className="text-[11px] uppercase tracking-[0.09em] text-[#767676]">
                  Verified Buyer
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Thin Monoline Arrow Controls & Indicators */}
        <div className="mt-10 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous customer testimonials"
            className="p-1.5 text-[#1C1C1C] hover:text-[#C46B3B] transition-colors cursor-pointer"
          >
            <svg
              viewBox="0 0 24 16"
              className="w-5 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              aria-hidden="true"
            >
              <path d="M22 8H2M8 2L2 8L8 14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {[0, 1].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPage(idx)}
                aria-label={`Testimonials set ${idx + 1}`}
                aria-current={page === idx ? 'true' : undefined}
                className={`h-[2px] transition-all cursor-pointer ${
                  page === idx ? 'w-7 bg-[#C46B3B]' : 'w-4 bg-[#D8D0C5] hover:bg-[#999999]'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next customer testimonials"
            className="p-1.5 text-[#1C1C1C] hover:text-[#C46B3B] transition-colors cursor-pointer"
          >
            <svg
              viewBox="0 0 24 16"
              className="w-5 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              aria-hidden="true"
            >
              <path d="M2 8H22M16 2L22 8L16 14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};
