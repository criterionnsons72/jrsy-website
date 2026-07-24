/**
 * Site footer. The branding credit "Developed by Syed Rizwan Ahmed" is
 * mandatory, stays readable on all breakpoints and both themes, and must
 * not overlap other footer content.
 */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface-2">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <a href="/catalog" className="hover:text-ink">
            Catalog
          </a>
          <a href="/how-measurement-works" className="hover:text-ink">
            How measurement works
          </a>
          <a href="/policies" className="hover:text-ink">
            Policies
          </a>
          <a href="/privacy" className="hover:text-ink">
            Privacy
          </a>
        </nav>
        <p className="font-mono text-xs text-faint sm:text-right">
          © {new Date().getFullYear()} Tailor Master
        </p>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-3 text-center font-mono text-[11px] tracking-wide text-muted sm:text-left">
          Developed by Syed Rizwan Ahmed
        </p>
      </div>
    </footer>
  );
}
