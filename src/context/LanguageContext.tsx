import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  CATEGORY_LABELS,
  COMMON_DICTIONARIES,
  type CommonDictionary,
  type Language,
} from '../i18n/common';

export type { CommonDictionary, Language };

export interface LanguageContextValue {
  lang: Language;
  setLang: (next: Language) => void;
  toggleLang: () => void;
  t: CommonDictionary;
  tr: (idText: string, enText: string) => string;
  getCategoryName: (slug: string, fallbackName?: string) => string;
}

const STORAGE_KEY = 'brakasa-lang';

const LanguageContext = createContext<LanguageContextValue | null>(null);

function normalizeLanguage(value: string | null | undefined): Language | null {
  if (!value) return null;
  const lowered = value.trim().toLowerCase();
  if (lowered === 'en' || lowered.startsWith('en-')) return 'en';
  if (lowered === 'id' || lowered.startsWith('id-')) return 'id';
  return null;
}

function readInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'id';
  }
  try {
    const saved = normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
    if (saved) {
      return saved;
    }
  } catch {
    // Ignore storage access errors
  }
  const docAttr = normalizeLanguage(document.documentElement.getAttribute('lang'));
  return docAttr ?? 'id';
}

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [lang, setLangState] = useState<Language>(readInitialLanguage);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore storage write errors
    }
  }, [lang]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        const next = normalizeLanguage(event.newValue);
        if (next) {
          setLangState(next);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'id' ? 'en' : 'id'));
  }, []);

  const tr = useCallback(
    (idText: string, enText: string) => (lang === 'en' ? enText : idText),
    [lang],
  );

  const getCategoryName = useCallback(
    (slug: string, fallbackName?: string) =>
      CATEGORY_LABELS[lang][slug] ?? fallbackName ?? slug,
    [lang],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      t: COMMON_DICTIONARIES[lang],
      tr,
      getCategoryName,
    }),
    [lang, setLang, toggleLang, tr, getCategoryName],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider.');
  }
  return ctx;
}
