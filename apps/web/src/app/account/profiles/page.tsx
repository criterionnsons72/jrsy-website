'use client';

import { useCallback, useEffect, useState } from 'react';

interface Profile {
  id: string;
  label: string;
  fitPreference: string;
  verifiedByTailor: boolean;
  measurements: { confidence: number | null; lockedAt: string | null }[];
}
interface ValidationResult {
  confidence: number;
  outlierFlags: Record<string, string>;
  errors?: string[];
}

const CRITICAL = ['chest', 'waist', 'hip'] as const;

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'auth' | 'error'>('loading');
  const [label, setLabel] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [saveErr, setSaveErr] = useState<string[] | null>(null);

  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('tm_token') : null);

  const load = useCallback(async () => {
    const t = token();
    if (!t) return setStatus('auth');
    try {
      const res = await fetch('/api/v1/body-profiles', { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) throw new Error();
      setProfiles(await res.json());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createProfile() {
    if (!label.trim()) return;
    await fetch('/api/v1/body-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ label }),
    });
    setLabel('');
    await load();
  }

  async function saveMeasurement(profileId: string) {
    setSaveErr(null);
    setResult(null);
    const numeric = (o: Record<string, string>) =>
      Object.fromEntries(
        Object.entries(o)
          .filter(([, v]) => v !== '')
          .map(([k, v]) => [k, Number(v)]),
      );
    const res = await fetch(`/api/v1/body-profiles/${profileId}/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        kind: 'body',
        source: 'manual',
        values: numeric(values),
        confirmValues: numeric(confirm),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveErr(data?.errors ?? [data?.message ?? 'Validation failed']);
      return;
    }
    setResult(data.validation);
    await load();
  }

  if (status === 'auth')
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-serif text-3xl font-semibold text-ink">Body profiles</h1>
        <p className="mt-4 text-muted">
          Please{' '}
          <a href="/login" className="text-brand underline">
            sign in
          </a>{' '}
          to manage your body profiles.
        </p>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">Body profiles</h1>
      <p className="mt-2 text-muted">
        Save multiple profiles (yours, family). Measurements are validated and reviewed by a tailor
        before production.
      </p>

      <div className="mt-6 flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="New profile (e.g. Mine)"
          className="flex-1 rounded-sm border border-line-strong bg-surface px-3 py-2 text-ink"
        />
        <button
          onClick={createProfile}
          className="rounded-sm bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          Add
        </button>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {profiles.map((p) => {
          const latest = p.measurements[0];
          return (
            <li key={p.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{p.label}</p>
                  <p className="font-mono text-xs text-muted">
                    Fit {p.fitPreference}
                    {latest?.confidence != null ? ` · confidence ${latest.confidence}%` : ''}
                    {latest?.lockedAt ? ' · locked' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {p.verifiedByTailor && (
                    <span className="rounded-full bg-good-tint px-2 py-0.5 font-mono text-[10px] text-good">
                      Verified
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setOpenId(openId === p.id ? null : p.id);
                      setResult(null);
                      setSaveErr(null);
                    }}
                    className="rounded-sm border border-line-strong px-3 py-1 font-mono text-xs text-ink hover:border-brand"
                  >
                    {openId === p.id ? 'Close' : 'Measure'}
                  </button>
                </div>
              </div>

              {openId === p.id && (
                <div className="mt-4 border-t border-line pt-4">
                  <p className="mb-3 font-mono text-xs uppercase tracking-wide text-faint">
                    Body measurements (cm) · ◆ critical need a confirm entry
                  </p>
                  <div className="flex flex-col gap-2">
                    {CRITICAL.map((k) => (
                      <div key={k} className="grid grid-cols-3 items-center gap-2">
                        <label className="font-mono text-xs capitalize text-muted">{k} ◆</label>
                        <input
                          type="number"
                          placeholder="value"
                          className="rounded-sm border border-line-strong bg-surface px-2 py-1.5 text-ink"
                          onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                        />
                        <input
                          type="number"
                          placeholder="confirm"
                          className="rounded-sm border border-line-strong bg-surface px-2 py-1.5 text-ink"
                          onChange={(e) => setConfirm((v) => ({ ...v, [k]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => saveMeasurement(p.id)}
                    className="mt-3 rounded-sm bg-mtm px-4 py-2 text-sm font-semibold text-white"
                  >
                    Save &amp; check
                  </button>

                  {saveErr && (
                    <ul className="mt-3">
                      {saveErr.map((e, i) => (
                        <li key={i} className="font-mono text-xs text-crit">
                          • {e}
                        </li>
                      ))}
                    </ul>
                  )}
                  {result && (
                    <div className="mt-3 font-mono text-xs text-muted">
                      Confidence <span className="text-good">{result.confidence}%</span>
                      {Object.keys(result.outlierFlags).length > 0 && (
                        <span className="text-warn">
                          {' '}
                          · outliers: {Object.entries(result.outlierFlags).map(([k, v]) => `${k}:${v}`).join(', ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
