
import React, { useState } from 'react';
import { CategoryItem } from '../services/api';
import { getCleanImage } from './FeaturedProductsSection';

interface CategoriesSectionProps {
  categories: CategoryItem[];
  onSelectCategory: (categoryName: string) => void;
  onViewAll?: () => void;
}

interface CategoryCardProps {
  category: CategoryItem;
  onClick: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = React.memo(
  ({ category, onClick }) => {
    const [imgError, setImgError] = useState(false);

    const cleanImg = getCleanImage(category.img, category.name);

    return (
      <article
        onClick={onClick}
        className="group bg-white border border-[#E8E4DD] hover:border-[#15472B] shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center justify-between p-5 sm:p-6 rounded-2xs select-none overflow-hidden"
      >
        {/* Studio Photo Container: Pure White with Centered Transparent Cutout */}
        <div className="w-full aspect-[4/3] flex items-center justify-center p-2 sm:p-3 overflow-hidden">
          {!imgError && cleanImg ? (
            <img
              src={cleanImg}
              alt={category.name}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
              className="max-w-full max-h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#15472B] font-serif-brand text-lg">
              {category.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Centered Bold Category Name */}
        <div className="mt-3 sm:mt-4 text-center w-full">
          <h3 className="text-[14px] sm:text-[15px] font-bold text-[#111111] group-hover:text-[#15472B] transition-colors leading-snug line-clamp-1">
            {category.name}
          </h3>
        </div>
      </article>
    );
  }
);

CategoryCard.displayName = 'CategoryCard';

export const CategoriesSection: React.FC<CategoriesSectionProps> = React.memo(
  ({ categories, onSelectCategory, onViewAll }) => {
    const [showAll, setShowAll] = useState(false);

    // Default to showing 6 categories, or all when expanded.
    const displayCategories = showAll
      ? categories
      : categories.slice(0, 6);

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
                  {showAll
                    ? 'Show Top 6'
                    : `View All (${categories.length})`}
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

          {/* Categories Grid */}
          {displayCategories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
              {displayCategories.map((category) => (
                <CategoryCard
                  key={category._id}
                  category={category}
                  onClick={() => onSelectCategory(category.name)}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-[#6E6A66]">
                No categories available at the moment.
              </p>
            </div>
          )}

        </div>
      </section>
    );
  }
);

CategoriesSection.displayName = 'CategoriesSection';
