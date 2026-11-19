import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { HeroSlideConfig } from '../../../shared/types';
import { useBootstrap } from '../../context/BootstrapContext';
import { useLanguage } from '../../context/LanguageContext';
import { DEFAULT_HERO_SLIDES } from '../../i18n/common';
import { IconChevronLeft, IconChevronRight } from '../ui/TacticalIcons';

function getSafeInternalUrl(candidate: string | undefined): string {
  if (candidate && candidate.startsWith('/')) {
    return candidate;
  }
  return '/store';
}

export function HeroSliderSection(): React.JSX.Element {
  const { data } = useBootstrap();
  const { lang, t } = useLanguage();

  const slides: readonly HeroSlideConfig[] = useMemo(() => {
    const configured = data?.settings?.heroSlides;
    if (configured && configured.length > 0) {
      return [...configured].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return DEFAULT_HERO_SLIDES;
  }, [data?.settings?.heroSlides]);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const safeIndex = activeIndex < slides.length ? activeIndex : 0;
  const activeSlide = slides[safeIndex] ?? DEFAULT_HERO_SLIDES[0];

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (slides.length <= 1) return;
      const normalized = ((nextIndex % slides.length) + slides.length) % slides.length;
      setActiveIndex(normalized);
    },
    [slides.length],
  );

  const goPrev = useCallback(() => {
    goToIndex(safeIndex - 1);
  }, [goToIndex, safeIndex]);

  const goNext = useCallback(() => {
    goToIndex(safeIndex + 1);
  }, [goToIndex, safeIndex]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  const activeHeadline =
    lang === 'en' ? activeSlide.headlineEn : activeSlide.headlineId;
  const activeCtaLabel =
    lang === 'en' ? activeSlide.ctaLabelEn : activeSlide.ctaLabelId;
  const activeCtaUrl = getSafeInternalUrl(activeSlide.ctaUrl);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t.hero.regionAria}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="hero-armory relative -mt-[56px] h-[100dvh] min-h-[540px] max-h-[1080px] w-full overflow-hidden bg-[#0F1110] lg:-mt-[68px]"
    >
      <div className="absolute inset-0">
        {slides.map((slide, index) => {
          const isActive = index === safeIndex;
          const slideAlt = lang === 'en' ? slide.altEn : slide.altId;

          return (
            <div
              key={slide.id || `${slide.imageUrl}-${index}`}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-[450ms] ease-out ${
                isActive ? 'z-[1] opacity-100' : 'pointer-events-none z-0 opacity-0'
              }`}
            >
              <img
                id={index === 0 ? 'hero-lcp-poster' : undefined}
                src={slide.imageUrl}
                alt={slideAlt}
                width={2400}
                height={1350}
                fetchPriority={index === 0 ? 'high' : undefined}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding={index === 0 ? 'sync' : 'async'}
                className="block h-full w-full object-cover object-center"
              />
            </div>
          );
        })}
      </div>

      <div
        aria-hidden="true"
        className="hero-armory-scrim pointer-events-none absolute inset-0 z-[2]"
      />

      <div className="container-brakasa relative z-10 flex h-full flex-col justify-end pb-20 sm:pb-24">
        <h1
          style={{
            color: 'var(--hero-text-primary)',
            fontSize: 'clamp(2.5rem, 5.6vw, 4.75rem)',
            lineHeight: 0.96,
          }}
          className="m-0 max-w-[14ch] font-display font-bold uppercase tracking-[-0.01em]"
        >
          {activeHeadline}
        </h1>

        <Link
          to={activeCtaUrl}
          style={{
            backgroundColor: 'var(--hero-cta-bg)',
            color: 'var(--hero-cta-fg)',
            borderColor: 'var(--hero-cta-bg)',
          }}
          className="btn-brakasa mt-6 min-h-[48px] w-fit px-7 text-sm font-semibold uppercase tracking-wide hover:brightness-105"
        >
          {activeCtaLabel}
        </Link>
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label={t.hero.prevSlideAria}
            className="absolute top-1/2 left-4 z-20 hidden min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-[4px] border border-[#7A847D] bg-[#0F1110]/60 text-[#F0EFEA] transition-colors hover:bg-[#0F1110]/85 sm:inline-flex"
          >
            <IconChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label={t.hero.nextSlideAria}
            className="absolute top-1/2 right-4 z-20 hidden min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-[4px] border border-[#7A847D] bg-[#0F1110]/60 text-[#F0EFEA] transition-colors hover:bg-[#0F1110]/85 sm:inline-flex"
          >
            <IconChevronRight size={20} />
          </button>

          <div
            role="tablist"
            aria-label={t.hero.dotsLabelAria}
            className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1"
          >
            {slides.map((slide, index) => {
              const isActive = index === safeIndex;
              const labelHeadline =
                lang === 'en' ? slide.headlineEn : slide.headlineId;

              return (
                <button
                  key={slide.id || index}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={t.hero.goToSlideAria(index + 1, labelHeadline)}
                  onClick={() => goToIndex(index)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center border-0 bg-transparent p-1"
                >
                  <span
                    className={`block h-2 rounded-[4px] transition-all duration-[180ms] ${
                      isActive
                        ? 'w-7 bg-[#E5A024]'
                        : 'w-2 bg-[#F0EFEA]/45 hover:bg-[#F0EFEA]/75'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}
