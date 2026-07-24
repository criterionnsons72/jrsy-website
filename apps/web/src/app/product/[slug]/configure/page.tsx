'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface Choice {
  id: string;
  label: string;
  priceDelta?: number;
  leadTimeDays?: number;
  requiresApproval?: boolean;
}
interface Group {
  key: string;
  label: string;
  type: 'select' | 'number' | 'boolean';
  required?: boolean;
  choices?: Choice[];
  min?: number;
  max?: number;
  unit?: string;
  default?: string | number | boolean;
}
interface Definition {
  currency?: string;
  groups: Group[];
}
interface PriceLine {
  key: string;
  label: string;
  amount: number;
}
interface Quote {
  currency: string;
  lines: PriceLine[];
  garmentSubtotal: number;
  total: number;
  leadTimeDays: number;
  approvalRequired: boolean;
  errors: string[];
}
interface Evaluation {
  disabledChoices: { group: string; choice: string }[];
  approvalRequired: boolean;
  errors: string[];
}

type Selections = Record<string, string | number | boolean>;

export default function ConfigurePage({ params }: { params: { slug: string } }) {
  const [def, setDef] = useState<Definition | null>(null);
  const [sel, setSel] = useState<Selections>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [evalResult, setEval] = useState<Evaluation | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load schema + seed defaults.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/v1/configurator/products/${params.slug}/schema`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const definition: Definition = data.definition;
        const defaults: Selections = {};
        definition.groups.forEach((g) => {
          if (g.default !== undefined) defaults[g.key] = g.default;
        });
        setDef(definition);
        setSel(defaults);
      } catch {
        setLoadError('Could not load the configurator. Is the API running and product seeded?');
      }
    })();
  }, [params.slug]);

  const recompute = useCallback(
    async (selections: Selections) => {
      const [qRes, eRes] = await Promise.all([
        fetch('/api/v1/pricing/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productSlug: params.slug, selections }),
        }),
        fetch('/api/v1/configurator/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productSlug: params.slug, selections }),
        }),
      ]);
      if (qRes.ok) setQuote(await qRes.json());
      if (eRes.ok) setEval(await eRes.json());
    },
    [params.slug],
  );

  useEffect(() => {
    if (def) void recompute(sel);
  }, [def, sel, recompute]);

  function set(key: string, value: string | number | boolean) {
    setSel((s) => ({ ...s, [key]: value }));
  }

  const isDisabled = (group: string, choice: string) =>
    evalResult?.disabledChoices.some((d) => d.group === group && d.choice === choice) ?? false;

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <div className="rounded border-l-[3px] border-crit bg-crit-tint px-4 py-3 text-ink">
          {loadError}
        </div>
        <Link href={`/product/${params.slug}`} className="mt-4 inline-block text-brand underline">
          ← Back to product
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link href={`/product/${params.slug}`} className="font-mono text-xs text-muted hover:text-ink">
        ← Back to product
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-ink">
        Customize your garment
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Options */}
        <div className="flex flex-col gap-5">
          {def?.groups.map((g) => (
            <div key={g.key} className="rounded-lg border border-line bg-surface p-4">
              <p className="mb-3 font-mono text-xs uppercase tracking-wide text-faint">
                {g.label}
                {g.required && <span className="text-crit"> *</span>}
              </p>

              {g.type === 'select' && (
                <div className="flex flex-wrap gap-2">
                  {g.choices?.map((c) => {
                    const disabled = isDisabled(g.key, c.id);
                    const active = sel[g.key] === c.id;
                    return (
                      <button
                        key={c.id}
                        disabled={disabled}
                        onClick={() => set(g.key, c.id)}
                        className={`rounded-full border px-3 py-1.5 font-mono text-xs transition ${
                          active
                            ? 'border-brand bg-brand text-white'
                            : disabled
                              ? 'border-line text-faint line-through opacity-50'
                              : 'border-line-strong text-ink hover:border-brand'
                        }`}
                      >
                        {c.label}
                        {c.priceDelta ? ` +${c.priceDelta}` : ''}
                        {c.requiresApproval ? ' ⚑' : ''}
                      </button>
                    );
                  })}
                </div>
              )}

              {g.type === 'number' && (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={g.min}
                    max={g.max}
                    value={Number(sel[g.key] ?? g.default ?? 0)}
                    onChange={(e) => set(g.key, Number(e.target.value))}
                    className="w-28 rounded-sm border border-line-strong bg-surface px-3 py-2 text-ink"
                  />
                  <span className="font-mono text-xs text-faint">
                    {g.unit} · {g.min}–{g.max}
                  </span>
                </div>
              )}

              {g.type === 'boolean' && (
                <button
                  onClick={() => set(g.key, !sel[g.key])}
                  className={`inline-flex h-6 w-11 items-center rounded-full transition ${
                    sel[g.key] ? 'bg-good' : 'bg-line-strong'
                  }`}
                  aria-pressed={Boolean(sel[g.key])}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white transition ${
                      sel[g.key] ? 'ml-5' : 'ml-0.5'
                    }`}
                  />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Live price */}
        <aside className="h-fit lg:sticky lg:top-6">
          <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
            <p className="font-mono text-xs uppercase tracking-wide text-faint">Live price</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-brass">
              {quote ? `${quote.currency} ${quote.total.toLocaleString()}` : '—'}
            </p>

            {quote && (
              <div className="mt-3 flex flex-col gap-1.5">
                {quote.lines.map((l) => (
                  <div key={l.key} className="flex justify-between font-mono text-xs text-muted">
                    <span>{l.label}</span>
                    <span>{l.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {quote && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-warn-tint px-2 py-0.5 font-mono text-[10px] text-warn">
                  Lead ~{quote.leadTimeDays} days
                </span>
                {(quote.approvalRequired || evalResult?.approvalRequired) && (
                  <span className="rounded-full bg-mtm-tint px-2 py-0.5 font-mono text-[10px] text-mtm">
                    Tailor approval ⚑
                  </span>
                )}
              </div>
            )}

            {quote && quote.errors.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1">
                {quote.errors.map((e, i) => (
                  <li key={i} className="font-mono text-[11px] text-crit">
                    • {e}
                  </li>
                ))}
              </ul>
            )}

            <button
              disabled={!quote || quote.errors.length > 0}
              className="mt-4 w-full rounded-sm bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-50"
            >
              Continue to measurements →
            </button>
            <p className="mt-2 font-mono text-[10px] text-faint">
              Measurement wizard &amp; try-on come in the next stages.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
