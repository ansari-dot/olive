import React, { useState } from 'react';
import { CategoryItem } from '../services/api';
import { getCleanImage } from './FeaturedProductsSection';

interface CategoriesSectionProps {
  categories: CategoryItem[];
  onSelectCategory: (categoryName: string) => void;
  onViewAll?: () => void;
}

export const CategoryCard: React.FC<{
  category: CategoryItem;
  onClick: () => void;
}> = ({ category, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const cleanImg = getCleanImage(category.img, category.name);

  return (
    <article
      onClick={onClick}
      className="group bg-white border border-[#E8E4DD] hover:border-[#15472B] shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center justify-between p-5 sm:p-6 rounded-2xs select-none overflow-hidden"
    >
      {/* Studio Photo Container: Pure White with Centered Transparent Cutout */}
      <div className="w-full aspect-[4/3] flex items-center justify-center p-2 sm:p-3 overflow-hidden">
        {!imgError ? (
          <img
            src={cleanImg}
            alt={category.name}
            onError={() => setImgError(true)}
            className="max-w-full max-h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#15472B] font-serif-brand text-lg">
            {category.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Centered Bold Category Name (Exact match to reference design) */}
      <div className="mt-3 sm:mt-4 text-center w-full">
        <h3 className="text-[14px] sm:text-[15px] font-bold text-[#111111] group-hover:text-[#15472B] transition-colors leading-snug line-clamp-1">
          {category.name}
        </h3>
      </div>
    </article>
  );
};

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  categories,
  onSelectCategory,
  onViewAll,
}) => {
  const [showAll, setShowAll] = useState(false);

  // Default to showing 6 top categories in 1 clean row (or 12 if expanded)
  const displayCategories = showAll ? categories : categories.slice(0, 6);

  return (
    <section
      aria-label="Shop By Category"
      className="w-full bg-[#FAF7F2] py-14 sm:py-18 border-t border-b border-[#EBE6DD]"
    >
      <div className="max-w-[1400px] xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-8 border-b border-[#E8E2D6]">
          <div>
            <h2 className="text-[22px] sm:text-[26px] lg:text-[28px] font-black uppercase tracking-tight text-[#111111] leading-none">
              Top Categories
            </h2>
            <p className="mt-1.5 text-[13px] text-[#6E6A66] font-normal">
              Explore pure cold-pressed extra virgins, stone-ground masalas, and wild Himalayan harvests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {categories.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="text-[12px] font-bold uppercase tracking-wider text-[#111111] hover:text-[#15472B] transition-colors cursor-pointer"
              >
                {showAll ? 'Show Top 6' : `View All (${categories.length})`}
              </button>
            )}
            {onViewAll && (
              <button
                type="button"
                onClick={onViewAll}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-white bg-[#15472B] hover:bg-[#1E5C38] px-4 py-2 rounded-2xs transition-colors cursor-pointer shadow-xs"
              >
                <span>Browse Shop</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories Grid (Exact card layout: 6 columns on lg, 3 on md, 2 on sm) */}
        {displayCategories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
            {displayCategories.map((cat) => (
              <CategoryCard
                key={cat.name}
                category={cat}
                onClick={() => onSelectCategory(cat.name)}
              />
            ))}
          </div>
        ) : (
          <div className="w-full py-14 text-center border border-dashed border-[#E5E7EB] bg-[#FAF8F5] rounded-xs">
            <p className="text-[14.5px] font-bold text-[#1F2937]">No products yet added</p>
            <p className="text-[12px] text-[#6B7280] mt-1">
              Category listings will appear automatically once products are seeded.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
