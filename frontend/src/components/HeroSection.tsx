import React, { useState, useEffect, useCallback } from 'react';
import { HeroSlide } from '../data/storeData';

interface HeroSectionProps {
  slides: HeroSlide[];
  onSlideAction?: (slide: HeroSlide) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = React.memo(({ slides, onSlideAction }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const slideCount = slides.length;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slideCount);
  }, [slideCount]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount);
  }, [slideCount]);

  useEffect(() => {
    if (isPaused || slideCount <= 1) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      goToNext();
    }, 6000);

    return () => window.clearInterval(timer);
  }, [isPaused, slideCount, goToNext]);

  if (slideCount === 0) return null;

  const activeSlide = slides[currentIndex];

  return (
    <section
      aria-label="Featured collections"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[390px] sm:h-[470px] lg:h-[540px] xl:h-[580px] overflow-hidden bg-[#174D35] select-none"
    >
      {/* Slides Layer */}
      {slides.map((slide, idx) => {
        const isActive = idx === currentIndex;
        const isBroken = failedImages[slide.id];
        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-500 ease-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Banner Photograph */}
            {!isBroken ? (
              <img
                src={slide.image}
                alt={slide.alt}
                loading={idx === 0 ? 'eager' : 'lazy'}
                fetchPriority={idx === 0 ? 'high' : 'low'}
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setFailedImages((prev) => ({ ...prev, [slide.id]: true }))}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#3C4B26] via-[#516334] to-[#283319]" />
            )}

            {/* Measured Contrast Scrim over text region */}
            <div
              className="absolute inset-0 bg-gradient-to-l from-black/45 via-black/25 to-black/10"
              aria-hidden="true"
            />

            {/* Right-of-Center Editorial Overlay matching reference layout */}
            <div className="relative z-10 w-full h-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-20 flex items-center">
              <div className="w-full md:ml-[42%] lg:ml-[43%] max-w-[540px]">
                <h1
                  className="font-serif-brand text-white text-[30px] sm:text-[40px] lg:text-[46px] font-normal leading-[1.12] tracking-[-0.01em] [text-wrap:balance] drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
                >
                  {slide.title}
                </h1>
                <p className="mt-2.5 text-white/95 text-[14.5px] sm:text-[16px] font-normal leading-[1.5] drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
                  {slide.subtitle}
                </p>
                <button
                  type="button"
                  onClick={() => onSlideAction?.(slide)}
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-sm bg-[#174D35] hover:bg-[#103B29] text-white text-[12px] sm:text-[12.5px] font-semibold uppercase tracking-[0.09em] px-8 py-3.5 transition-colors duration-150 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {slide.ctaLabel}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Left Edge Arrow Button */}
      <button
        type="button"
        onClick={goToPrev}
        aria-label="Previous slide"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-[38px] h-[42px] sm:w-[42px] sm:h-[46px] bg-white/90 hover:bg-white text-[#444444] hover:text-[#111111] flex items-center justify-center transition-colors duration-150 cursor-pointer shadow-md focus-visible:outline-2 focus-visible:outline-[#224D26]"
      >
        <svg viewBox="0 0 18 14" className="w-4 h-3.5" fill="none" aria-hidden="true">
          <path
            d="M16 7H2M2 7L7.5 1.5M2 7L7.5 12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Right Edge Arrow Button */}
      <button
        type="button"
        onClick={goToNext}
        aria-label="Next slide"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-[38px] h-[42px] sm:w-[42px] sm:h-[46px] bg-white/90 hover:bg-white text-[#444444] hover:text-[#111111] flex items-center justify-center transition-colors duration-150 cursor-pointer shadow-md focus-visible:outline-2 focus-visible:outline-[#224D26]"
      >
        <svg viewBox="0 0 18 14" className="w-4 h-3.5" fill="none" aria-hidden="true">
          <path
            d="M2 7H16M16 7L10.5 1.5M16 7L10.5 12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Bottom Centered Pagination Dots */}
      <div
        role="tablist"
        aria-label="Hero slide pagination"
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5"
      >
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Show slide ${idx + 1}: ${slide.title}`}
              onClick={() => setCurrentIndex(idx)}
              className={`w-[9px] h-[9px] rounded-full transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                isActive
                  ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)]'
                  : 'border-[1.5px] border-white bg-transparent hover:bg-white/40'
              }`}
            />
          );
        })}
      </div>

      {/* Screen-reader live announcement of current slide */}
      <span className="sr-only" aria-live="polite">
        {activeSlide.title}
      </span>
    </section>
  );
});
