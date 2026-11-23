import React from 'react';
import { Leaf, ShieldCheck, Sparkles } from 'lucide-react';

const BRAND_VALUES = [
  {
    title: 'Quality',
    description: 'Clear, product-specific information helps customers choose with confidence.',
    Icon: ShieldCheck,
  },
  {
    title: 'Authenticity',
    description: 'A broad collection that respects natural ingredients and traditional knowledge.',
    Icon: Leaf,
  },
  {
    title: 'Transparency',
    description: 'Product details and claims are shared only when supported by verified information.',
    Icon: Sparkles,
  },
];

export const TestimonialsSection: React.FC = React.memo(() => (
  <section
    id="testimonials"
    aria-labelledby="brand-values-heading"
    className="w-full bg-[#174D35] py-16 sm:py-20 lg:py-24"
  >
    <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center sm:mb-12">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D6B878]">
          Nature · Authenticity · Trust
        </p>
        <h2
          id="brand-values-heading"
          className="font-serif-brand text-3xl font-normal text-white sm:text-4xl"
        >
          What guides us
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
        {BRAND_VALUES.map(({ title, description, Icon }) => (
          <article
            key={title}
            className="rounded-xl border border-white/15 bg-white p-6 sm:p-8"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#F3EBDD] text-[#174D35]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-serif-brand text-2xl font-normal text-[#174D35]">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#526056]">{description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
));
