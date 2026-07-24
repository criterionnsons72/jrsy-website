'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearAuth, getAuth } from '@/lib/auth';
import { useLocale } from '@/i18n/LocaleProvider';

export function Header() {
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setEmail(getAuth().email);
    sync();
    window.addEventListener('tm-auth-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('tm-auth-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  function signOut() {
    clearAuth();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded bg-brand font-serif font-semibold text-white">
            ط
          </span>
          <span className="font-serif text-lg font-semibold text-ink">Tailor Master</span>
        </Link>

        <nav className="ms-auto flex items-center gap-4 font-mono text-xs text-muted">
          <Link href="/catalog" className="hover:text-ink">
            {t('nav.catalog')}
          </Link>
          <Link href="/cart" className="hover:text-ink">
            {t('nav.cart')}
          </Link>
          {email ? (
            <>
              <Link href="/account/profiles" className="hover:text-ink">
                {t('nav.account')}
              </Link>
              <button onClick={signOut} className="text-brand hover:underline">
                {t('nav.signOut')}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-sm bg-brand px-3 py-1.5 font-semibold text-white hover:bg-brand-strong"
            >
              {t('nav.signIn')}
            </Link>
          )}
          <button
            onClick={() => setLocale(locale === 'en' ? 'ur' : 'en')}
            className="rounded-sm border border-line-strong px-2 py-1 hover:border-brand"
            aria-label={t('nav.language')}
            title={t('nav.language')}
          >
            {locale === 'en' ? 'اردو' : 'EN'}
          </button>
        </nav>
      </div>
    </header>
  );
}
