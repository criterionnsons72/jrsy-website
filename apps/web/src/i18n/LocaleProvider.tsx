'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dictionaries, LOCALES, type Locale } from './dictionaries';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (k) => k,
  dir: 'ltr',
});

const STORAGE_KEY = 'tm_locale';

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && (saved === 'en' || saved === 'ur')) setLocaleState(saved);
  }, []);

  const dir = LOCALES.find((l) => l.code === locale)?.dir ?? 'ltr';

  // Reflect locale on the document so RTL + lang apply site-wide.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    // Urdu renders in the Nastaliq stack when available.
    document.documentElement.style.setProperty(
      '--tm-active-font',
      locale === 'ur' ? 'var(--tm-font-urdu)' : 'var(--tm-font-sans)',
    );
  }, [locale, dir]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string) => dictionaries[locale][key] ?? dictionaries.en[key] ?? key,
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t, dir }), [locale, setLocale, t, dir]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = (): LocaleContextValue => useContext(LocaleContext);
