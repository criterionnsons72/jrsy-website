import type { Config } from 'tailwindcss';

/**
 * Colors are wired to CSS custom properties defined in globals.css
 * (from docs/design-tokens.css). This keeps light/dark theming at the
 * token level — the viewer's theme flips the variables, not the classes.
 */
const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--tm-paper)',
        surface: 'var(--tm-surface)',
        'surface-2': 'var(--tm-surface-2)',
        ink: 'var(--tm-ink)',
        muted: 'var(--tm-muted)',
        faint: 'var(--tm-faint)',
        line: 'var(--tm-line)',
        'line-strong': 'var(--tm-line-strong)',
        brand: {
          DEFAULT: 'var(--tm-brand)',
          strong: 'var(--tm-brand-strong)',
          tint: 'var(--tm-brand-tint)',
        },
        brass: {
          DEFAULT: 'var(--tm-brass)',
          strong: 'var(--tm-brass-strong)',
          tint: 'var(--tm-brass-tint)',
        },
        preview: { DEFAULT: 'var(--tm-preview)', tint: 'var(--tm-preview-tint)' },
        fit: { DEFAULT: 'var(--tm-fit)', tint: 'var(--tm-fit-tint)' },
        mtm: { DEFAULT: 'var(--tm-mtm)', tint: 'var(--tm-mtm-tint)' },
        good: { DEFAULT: 'var(--tm-good)', tint: 'var(--tm-good-tint)' },
        warn: { DEFAULT: 'var(--tm-warn)', tint: 'var(--tm-warn-tint)' },
        crit: { DEFAULT: 'var(--tm-crit)', tint: 'var(--tm-crit-tint)' },
      },
      fontFamily: {
        serif: 'var(--tm-font-serif)',
        sans: 'var(--tm-font-sans)',
        mono: 'var(--tm-font-mono)',
        urdu: 'var(--tm-font-urdu)',
      },
      borderRadius: {
        sm: 'var(--tm-r-sm)',
        DEFAULT: 'var(--tm-r)',
        lg: 'var(--tm-r-lg)',
      },
      boxShadow: {
        card: 'var(--tm-shadow)',
        lg: 'var(--tm-shadow-lg)',
      },
    },
  },
  plugins: [],
};

export default config;
