'use client';

import { useState } from 'react';

interface JobView {
  id: string;
  status: string;
  resultAssetKey?: string | null;
  error?: string | null;
  disclaimer?: string;
}

const DISCLAIMER =
  'Style Preview shows look only — not a guaranteed fit. For fit, use measurements & tailor review.';

/**
 * Stage 10 try-on page. Real object-storage upload (presigned URL) is wired in
 * the storage stage; here we send a simulated asset key + image metadata so the
 * end-to-end consent → quality → job → result → delete flow is exercised.
 */
export default function TryOnPage() {
  const [consented, setConsented] = useState(false);
  const [full, setFull] = useState(true);
  const [job, setJob] = useState<JobView | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('tm_token') : null);
  const authed = () => Boolean(token());

  async function grantConsent() {
    setMsg(null);
    const res = await fetch('/api/v1/tryon/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ purpose: 'tryon_image' }),
    });
    if (res.ok) setConsented(true);
    else setMsg('Could not record consent (are you signed in?).');
  }

  async function createJob() {
    setBusy(true);
    setMsg(null);
    setJob(null);
    const res = await fetch('/api/v1/tryon/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        inputAssetKey: `demo/${Date.now()}.jpg`,
        imageMeta: { width: 720, height: 1280, hasFullBody: full },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg((data?.reasons ?? [data?.message]).join(' '));
      setBusy(false);
      return;
    }
    await poll(data.id);
    setBusy(false);
  }

  async function poll(id: string) {
    for (let i = 0; i < 8; i++) {
      const res = await fetch(`/api/v1/tryon/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data: JobView = await res.json();
      setJob(data);
      if (data.status === 'ready' || data.status === 'failed') return;
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  async function del() {
    if (!job) return;
    await fetch(`/api/v1/tryon/jobs/${job.id}/assets`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    });
    setJob(null);
    setMsg('Your image and result were securely deleted.');
  }

  if (!authed()) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-serif text-3xl font-semibold text-ink">Try your style</h1>
        <p className="mt-4 text-muted">Please sign in to use the style preview (API is live).</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-preview-tint px-3 py-1 font-mono text-xs text-preview">
          ◇ Style Preview
        </span>
        <span className="rounded-full bg-brass-tint px-3 py-1 font-mono text-xs text-brass">
          Mock provider
        </span>
      </div>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink">Try your style</h1>

      <div className="mt-6 rounded-lg border border-line bg-surface p-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={consented}
            onChange={() => (consented ? setConsented(false) : void grantConsent())}
            className="mt-1"
          />
          <span>
            I consent to processing my image to generate a <b>style preview</b>. It is stored
            encrypted, accessed via short-lived links, and I can delete it anytime.
          </span>
        </label>

        <label className="mt-3 flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} />
          Photo shows my full body (uncheck to see the quality check fail)
        </label>

        <button
          onClick={createJob}
          disabled={!consented || busy}
          className="mt-4 rounded-sm bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-50"
        >
          {busy ? 'Processing…' : 'Create preview'}
        </button>

        {msg && <p className="mt-3 font-mono text-xs text-warn">{msg}</p>}

        {job && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="font-mono text-xs text-muted">
              Job {job.id.slice(0, 8)} · status <b className="text-ink">{job.status}</b>
            </p>
            {job.status === 'ready' && (
              <>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="flex aspect-[4/5] items-center justify-center rounded bg-surface-2 font-mono text-xs text-faint">
                    original
                  </div>
                  <div className="flex aspect-[4/5] items-center justify-center rounded border border-preview bg-preview-tint font-mono text-xs text-preview">
                    style preview
                  </div>
                </div>
                <p className="mt-3 border-l-[3px] border-preview bg-preview-tint px-3 py-2 text-xs text-ink">
                  ◇ {job.disclaimer ?? DISCLAIMER}
                </p>
                <button
                  onClick={del}
                  className="mt-3 rounded-sm border border-crit px-4 py-2 font-mono text-xs text-crit"
                >
                  Delete my image &amp; result
                </button>
              </>
            )}
            {job.status === 'failed' && (
              <p className="mt-2 font-mono text-xs text-crit">Failed: {job.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
