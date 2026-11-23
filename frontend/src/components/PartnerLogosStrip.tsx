import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface ProductFamiliesProps {
  onSelectCategory?: (categoryName: string) => void;
  className?: string;
}

const PRODUCT_FAMILIES = [
  { label: 'Ground Spices', category: 'Ground Spices' },
  { label: 'Olive Products', category: 'Olive Products' },
  { label: 'Herbs & Botanicals', category: 'Herbs and Botanicals' },
  { label: 'Tea & Infusions', category: 'Tea and Herbal Infusions' },
  { label: 'Healthy Snacks', category: 'Healthy Snacks' },
];

export const PartnerLogosStrip: React.FC<ProductFamiliesProps> = React.memo(({
  onSelectCategory,
  className = '',
}) => (
  <section
    aria-labelledby="product-families-heading"
    className={`mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8 ${className}`}
  >
    <div className="mb-7 text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#75513A]">
        Explore PAK VEDA
      </p>
      <h2
        id="product-families-heading"
        className="font-serif-brand text-3xl font-normal text-[#174D35] sm:text-4xl"
      >
        A collection for every day
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#66736A]">
        Browse the portfolio by product family, from pantry ingredients to botanicals and snacks.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {PRODUCT_FAMILIES.map((family) => (
        <button
          key={family.category}
          type="button"
          onClick={() => onSelectCategory?.(family.category)}
          className="group flex min-h-24 items-center justify-between gap-3 rounded-lg border border-[#E6E0D3] bg-white px-4 py-4 text-left transition-colors hover:border-[#174D35] hover:bg-[#FAF8F3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174D35]"
        >
          <span className="font-medium text-[#23362B] group-hover:text-[#174D35]">{family.label}</span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-[#9A8B6C]" aria-hidden="true" />
        </button>
      ))}
    </div>
  </section>
));
