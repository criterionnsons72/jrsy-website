'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getAuth } from '@/lib/auth';

// ---- Types mirroring the API schema definition ----
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
interface Rule {
  id: string;
  description?: string;
  when: { group: string; equals?: string | number | boolean }[];
  then: Record<string, unknown>[];
}
interface Definition {
  currency?: string;
  baseLeadTimeDays?: number;
  groups: Group[];
  rules?: Rule[];
}
interface SchemaRow {
  id: string;
  name: string;
  version: number;
  isPublished: boolean;
}

const ACTIONS = ['disableChoice', 'requireApproval', 'addPrice', 'addLeadTime', 'error'] as const;

export default function RuleEditorPage() {
  const [schemas, setSchemas] = useState<SchemaRow[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [def, setDef] = useState<Definition | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'auth' | 'forbidden'>('loading');
  const [errors, setErrors] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const token = () => getAuth().token;
  const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

  const loadList = useCallback(async () => {
    if (!token()) return setStatus('auth');
    const res = await fetch('/api/v1/admin/config-schemas', { headers: h() });
    if (res.status === 403) return setStatus('forbidden');
    if (res.ok) setSchemas(await res.json());
    setStatus('ready');
    // token()/h() read localStorage at call time; safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function open(id: string) {
    setErrors([]);
    setMsg(null);
    const res = await fetch(`/api/v1/admin/config-schemas/${id}`, { headers: h() });
    if (res.ok) {
      const data = await res.json();
      setSelId(id);
      setDef(data.definition);
    }
  }

  function patch(update: Partial<Definition>) {
    setDef((d) => (d ? { ...d, ...update } : d));
  }
  function patchGroup(gi: number, u: Partial<Group>) {
    setDef((d) => {
      if (!d) return d;
      const groups = d.groups.map((g, i) => (i === gi ? { ...g, ...u } : g));
      return { ...d, groups };
    });
  }
  function patchChoice(gi: number, ci: number, u: Partial<Choice>) {
    setDef((d) => {
      if (!d) return d;
      const groups = d.groups.map((g, i) => {
        if (i !== gi) return g;
        const choices = (g.choices ?? []).map((c, j) => (j === ci ? { ...c, ...u } : c));
        return { ...g, choices };
      });
      return { ...d, groups };
    });
  }

  async function saveVersion() {
    if (!selId || !def) return;
    setErrors([]);
    setMsg(null);
    const res = await fetch(`/api/v1/admin/config-schemas/${selId}/versions`, {
      method: 'POST',
      headers: h(),
      body: JSON.stringify({ definition: def }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrors(data?.errors ?? [data?.message ?? 'Save failed']);
      return;
    }
    setMsg(`Saved as version ${data.version}. Publish it to make it live.`);
    await loadList();
    setSelId(data.id);
  }

  async function publish(id: string) {
    await fetch(`/api/v1/admin/config-schemas/${id}/publish`, { method: 'PATCH', headers: h() });
    setMsg('Published.');
    await loadList();
  }

  if (status === 'auth' || status === 'forbidden')
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-serif text-3xl font-semibold text-ink">Rule Editor</h1>
        <p className="mt-4 text-muted">
          {status === 'auth' ? (
            <>
              Please{' '}
              <Link href="/login" className="text-brand underline">
                sign in
              </Link>{' '}
              with a catalog-manager / admin role.
            </>
          ) : (
            'This area needs a catalog-manager or admin role.'
          )}
        </p>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">Rule Editor</h1>
      <p className="mt-2 text-muted">
        Build customization options and rules — no code. Saving creates a new version; existing
        orders keep the version they were built with.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Schema list */}
        <aside className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-wide text-faint">Schemas</p>
          {schemas.map((s) => (
            <button
              key={s.id}
              onClick={() => open(s.id)}
              className={`rounded-lg border px-3 py-2 text-left text-sm ${
                selId === s.id
                  ? 'border-brand bg-brand-tint text-brand'
                  : 'border-line text-ink hover:border-brand'
              }`}
            >
              <span className="font-medium">{s.name}</span>
              <span className="ms-1 font-mono text-xs text-muted">v{s.version}</span>
              {s.isPublished && (
                <span className="ms-2 rounded-full bg-good-tint px-1.5 py-0.5 font-mono text-[9px] text-good">
                  live
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* Editor */}
        <div>
          {!def ? (
            <p className="text-muted">Select a schema to edit.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {errors.length > 0 && (
                <ul className="rounded-lg border-l-[3px] border-crit bg-crit-tint px-4 py-3">
                  {errors.map((e, i) => (
                    <li key={i} className="font-mono text-xs text-ink">
                      • {e}
                    </li>
                  ))}
                </ul>
              )}
              {msg && (
                <p className="rounded-lg border-l-[3px] border-good bg-good-tint px-4 py-3 text-sm text-ink">
                  {msg}
                </p>
              )}

              {/* Option groups */}
              {def.groups.map((g, gi) => (
                <div key={gi} className="rounded-lg border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={g.label}
                      onChange={(e) => patchGroup(gi, { label: e.target.value })}
                      className="rounded-sm border border-line-strong bg-surface px-2 py-1 text-sm font-medium text-ink"
                    />
                    <input
                      value={g.key}
                      onChange={(e) => patchGroup(gi, { key: e.target.value })}
                      className="w-28 rounded-sm border border-line-strong bg-surface px-2 py-1 font-mono text-xs text-muted"
                    />
                    <select
                      value={g.type}
                      onChange={(e) => patchGroup(gi, { type: e.target.value as Group['type'] })}
                      className="rounded-sm border border-line-strong bg-surface px-2 py-1 font-mono text-xs"
                    >
                      <option value="select">select</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                    </select>
                    <button
                      onClick={() => patch({ groups: def.groups.filter((_, i) => i !== gi) })}
                      className="ms-auto font-mono text-xs text-crit hover:underline"
                    >
                      remove
                    </button>
                  </div>

                  {g.type === 'select' && (
                    <div className="mt-3 flex flex-col gap-2">
                      {(g.choices ?? []).map((c, ci) => (
                        <div
                          key={ci}
                          className="flex flex-wrap items-center gap-2 rounded bg-surface-2 p-2"
                        >
                          <input
                            value={c.label}
                            onChange={(e) => patchChoice(gi, ci, { label: e.target.value })}
                            placeholder="Label"
                            className="rounded-sm border border-line-strong bg-surface px-2 py-1 text-xs"
                          />
                          <input
                            value={c.id}
                            onChange={(e) => patchChoice(gi, ci, { id: e.target.value })}
                            placeholder="id"
                            className="w-24 rounded-sm border border-line-strong bg-surface px-2 py-1 font-mono text-xs text-muted"
                          />
                          <label className="font-mono text-xs text-muted">
                            +price
                            <input
                              type="number"
                              value={c.priceDelta ?? ''}
                              onChange={(e) =>
                                patchChoice(gi, ci, {
                                  priceDelta: e.target.value ? Number(e.target.value) : undefined,
                                })
                              }
                              className="ms-1 w-16 rounded-sm border border-line-strong bg-surface px-1 py-1"
                            />
                          </label>
                          <label className="font-mono text-xs text-muted">
                            +days
                            <input
                              type="number"
                              value={c.leadTimeDays ?? ''}
                              onChange={(e) =>
                                patchChoice(gi, ci, {
                                  leadTimeDays: e.target.value ? Number(e.target.value) : undefined,
                                })
                              }
                              className="ms-1 w-12 rounded-sm border border-line-strong bg-surface px-1 py-1"
                            />
                          </label>
                          <label className="flex items-center gap-1 font-mono text-xs text-muted">
                            <input
                              type="checkbox"
                              checked={Boolean(c.requiresApproval)}
                              onChange={(e) =>
                                patchChoice(gi, ci, { requiresApproval: e.target.checked })
                              }
                            />
                            approval
                          </label>
                          <button
                            onClick={() =>
                              patchGroup(gi, {
                                choices: (g.choices ?? []).filter((_, j) => j !== ci),
                              })
                            }
                            className="ms-auto font-mono text-xs text-crit"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          patchGroup(gi, {
                            choices: [
                              ...(g.choices ?? []),
                              { id: `opt${(g.choices?.length ?? 0) + 1}`, label: 'New option' },
                            ],
                          })
                        }
                        className="w-fit rounded-sm border border-line-strong px-2 py-1 font-mono text-xs text-muted hover:border-brand"
                      >
                        + choice
                      </button>
                    </div>
                  )}

                  {g.type === 'number' && (
                    <div className="mt-3 flex flex-wrap gap-3 font-mono text-xs text-muted">
                      {(['min', 'max'] as const).map((k) => (
                        <label key={k}>
                          {k}
                          <input
                            type="number"
                            value={g[k] ?? ''}
                            onChange={(e) =>
                              patchGroup(gi, {
                                [k]: e.target.value ? Number(e.target.value) : undefined,
                              } as Partial<Group>)
                            }
                            className="ms-1 w-16 rounded-sm border border-line-strong bg-surface px-1 py-1"
                          />
                        </label>
                      ))}
                      <label>
                        unit
                        <input
                          value={g.unit ?? ''}
                          onChange={(e) => patchGroup(gi, { unit: e.target.value })}
                          className="ms-1 w-14 rounded-sm border border-line-strong bg-surface px-1 py-1"
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() =>
                  patch({
                    groups: [
                      ...def.groups,
                      {
                        key: `group${def.groups.length + 1}`,
                        label: 'New group',
                        type: 'select',
                        choices: [],
                      },
                    ],
                  })
                }
                className="w-fit rounded-sm border border-line-strong px-3 py-2 font-mono text-xs text-muted hover:border-brand"
              >
                + option group
              </button>

              {/* Rules */}
              <RulesEditor def={def} setDef={setDef} />

              <div className="flex flex-wrap gap-3 border-t border-line pt-4">
                <button
                  onClick={saveVersion}
                  className="rounded-sm bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong"
                >
                  Save as new version
                </button>
                {selId && (
                  <button
                    onClick={() => publish(selId)}
                    className="rounded-sm border border-good px-5 py-2.5 text-sm font-semibold text-good"
                  >
                    Publish (make live)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RulesEditor({ def, setDef }: { def: Definition; setDef: (d: Definition) => void }) {
  const rules = def.rules ?? [];

  function update(ri: number, u: Partial<Rule>) {
    setDef({ ...def, rules: rules.map((r, i) => (i === ri ? { ...r, ...u } : r)) });
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="mb-3 font-mono text-xs uppercase tracking-wide text-faint">Rules</p>
      {rules.map((r, ri) => {
        const action = (r.then[0]?.action as string) ?? 'requireApproval';
        return (
          <div
            key={ri}
            className="mb-2 flex flex-wrap items-center gap-2 rounded bg-surface-2 p-2 text-xs"
          >
            <span className="font-mono text-muted">WHEN</span>
            <input
              value={r.when[0]?.group ?? ''}
              onChange={(e) => update(ri, { when: [{ ...r.when[0], group: e.target.value }] })}
              placeholder="group"
              className="w-24 rounded-sm border border-line-strong bg-surface px-2 py-1 font-mono"
            />
            <span className="font-mono text-muted">=</span>
            <input
              value={String(r.when[0]?.equals ?? '')}
              onChange={(e) => update(ri, { when: [{ ...r.when[0], equals: e.target.value }] })}
              placeholder="value"
              className="w-24 rounded-sm border border-line-strong bg-surface px-2 py-1 font-mono"
            />
            <span className="font-mono text-muted">THEN</span>
            <select
              value={action}
              onChange={(e) => {
                const a = e.target.value;
                const then: Record<string, unknown> =
                  a === 'disableChoice'
                    ? { action: a, group: '', choice: '' }
                    : a === 'addPrice'
                      ? { action: a, amount: 0 }
                      : a === 'addLeadTime'
                        ? { action: a, days: 0 }
                        : a === 'error'
                          ? { action: a, message: '' }
                          : { action: a };
                update(ri, { then: [then] });
              }}
              className="rounded-sm border border-line-strong bg-surface px-2 py-1 font-mono"
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            {action === 'disableChoice' && (
              <>
                <input
                  value={String(r.then[0]?.group ?? '')}
                  onChange={(e) => update(ri, { then: [{ ...r.then[0], group: e.target.value }] })}
                  placeholder="group"
                  className="w-20 rounded-sm border border-line-strong bg-surface px-2 py-1 font-mono"
                />
                <input
                  value={String(r.then[0]?.choice ?? '')}
                  onChange={(e) => update(ri, { then: [{ ...r.then[0], choice: e.target.value }] })}
                  placeholder="choice"
                  className="w-20 rounded-sm border border-line-strong bg-surface px-2 py-1 font-mono"
                />
              </>
            )}
            {action === 'addPrice' && (
              <input
                type="number"
                value={Number(r.then[0]?.amount ?? 0)}
                onChange={(e) => update(ri, { then: [{ action, amount: Number(e.target.value) }] })}
                className="w-20 rounded-sm border border-line-strong bg-surface px-2 py-1 font-mono"
              />
            )}
            <button
              onClick={() => setDef({ ...def, rules: rules.filter((_, i) => i !== ri) })}
              className="ms-auto font-mono text-crit"
            >
              ✕
            </button>
          </div>
        );
      })}
      <button
        onClick={() =>
          setDef({
            ...def,
            rules: [
              ...rules,
              {
                id: `rule${rules.length + 1}`,
                when: [{ group: '', equals: '' }],
                then: [{ action: 'requireApproval' }],
              },
            ],
          })
        }
        className="rounded-sm border border-line-strong px-2 py-1 font-mono text-xs text-muted hover:border-brand"
      >
        + rule
      </button>
    </div>
  );
}
