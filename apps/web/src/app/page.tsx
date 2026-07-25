'use client';

import Link from 'next/link';
import { useLocale } from '@/i18n/LocaleProvider';

/**
 * Landing page. Bilingual (English / Urdu) via the locale context; the layout
 * mirrors to RTL automatically for Urdu.
 */
export default function HomePage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-brass">
        {t('home.eyebrow')}
      </p>
      <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
        {t('home.title')}
      </h1>
      <p className="mt-5 max-w-xl text-muted">{t('home.subtitle')}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-preview-tint px-3 py-1 font-mono text-xs text-preview">
          {t('lane.preview')}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-fit-tint px-3 py-1 font-mono text-xs text-fit">
          {t('lane.fit')}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-mtm-tint px-3 py-1 font-mono text-xs text-mtm">
          {t('lane.mtm')}
        </span>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/catalog"
          className="rounded-sm bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong"
        >
          {t('home.browse')}
        </Link>
      </div>
    </div>
  );
}
