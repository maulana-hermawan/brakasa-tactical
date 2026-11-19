import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBootstrap } from '../../context/BootstrapContext';
import { useLanguage } from '../../context/LanguageContext';
import { CATEGORY_IMAGE_MAP, DEFAULT_CATEGORIES } from '../../i18n/common';

interface DisplayCategory {
  slug: string;
  name: string;
  imageUrl: string;
}

export function FeaturedCategoriesGrid(): React.JSX.Element {
  const { data } = useBootstrap();
  const { t, getCategoryName } = useLanguage();

  const categories: DisplayCategory[] = useMemo(() => {
    if (data?.categories && data.categories.length > 0) {
      return data.categories.map((cat) => ({
        slug: cat.slug,
        name: getCategoryName(cat.slug, cat.name),
        imageUrl:
          cat.imageUrl ||
          CATEGORY_IMAGE_MAP[cat.slug] ||
          '/media/images/products/brk-ar-001.jpg',
      }));
    }

    return DEFAULT_CATEGORIES.map((cat) => ({
      slug: cat.slug,
      name: getCategoryName(cat.slug),
      imageUrl: cat.imageUrl,
    }));
  }, [data?.categories, getCategoryName]);

  return (
    <section
      id="categories"
      className="scroll-mt-20 border-t border-[var(--border-subtle)] py-12 sm:py-16 lg:py-20"
    >
      <div className="container-brakasa">
        <h2 className="mt-0 mb-6 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold uppercase tracking-tight sm:mb-8">
          {t.categoriesSection.title}
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:gap-5">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/store?category=${encodeURIComponent(cat.slug)}`}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[2px] border border-[var(--border-subtle)] bg-[#0F1110] no-underline transition-colors hover:border-[var(--border-strong)]"
            >
              <img
                src={cat.imageUrl}
                alt={cat.name}
                width={1600}
                height={900}
                loading="lazy"
                decoding="async"
                className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(15,17,16,0.06) 35%, rgba(15,17,16,0.82) 100%)',
                }}
                className="pointer-events-none absolute inset-0"
              />
              <span className="absolute inset-x-0 bottom-0 p-3.5 font-display text-lg font-bold uppercase leading-tight tracking-wide text-[#F0EFEA] sm:p-5 sm:text-xl lg:text-2xl">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
