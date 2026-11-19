import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { HeroSliderSection } from '../components/landing/HeroSliderSection';
import { FeaturedProductsCarousel } from '../components/landing/FeaturedProductsCarousel';
import { FeaturedCategoriesGrid } from '../components/landing/FeaturedCategoriesGrid';
import { OurStoreSection } from '../components/landing/OurStoreSection';

export function LandingPage(): React.JSX.Element {
  const { t } = useLanguage();
  useDocumentTitle(t.landing.docTitle);

  return (
    <div className="min-w-0">
      <HeroSliderSection />
      <FeaturedProductsCarousel />
      <FeaturedCategoriesGrid />
      <OurStoreSection />
    </div>
  );
}
