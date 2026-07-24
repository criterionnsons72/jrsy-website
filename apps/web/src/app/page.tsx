import Link from 'next/link';

/**
 * Landing page. Links into the Stage 7 catalog.
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-brass">
        Tailor Master · Foundation
      </p>
      <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
        Made to measure, from style preview to a garment that actually fits.
      </h1>
      <p className="mt-5 max-w-xl text-muted">
        This is the Stage 6 foundation. The design system, theming, and build are wired up.
        Catalog, configurator, measurements, try-on and the workshop workflow are built in the
        stages that follow.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-preview-tint px-3 py-1 font-mono text-xs text-preview">
          Style Preview
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-fit-tint px-3 py-1 font-mono text-xs text-fit">
          Fit Recommendation
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-mtm-tint px-3 py-1 font-mono text-xs text-mtm">
          Made-to-Measure
        </span>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/catalog"
          className="rounded-sm bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong"
        >
          Browse catalog
        </Link>
        <a
          href="/api/v1/health"
          className="rounded-sm border border-line-strong px-5 py-3 text-sm text-ink transition hover:bg-surface-2"
        >
          API health ↗
        </a>
      </div>
    </div>
  );
}
