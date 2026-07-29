'use client';

import { useEffect, useState } from 'react';
import { getAuth } from '@/lib/auth';
import { readImageMeta, uploadViaPresign } from '@/lib/upload';

interface GarmentOption {
  id: string;
  title: string;
  images: { url: string }[];
}

interface JobView {
  id: string;
  status: string;
  resultUrl?: string | null;
  error?: string | null;
  disclaimer?: string;
}

const DISCLAIMER =
  'Style Preview shows look only — not a guaranteed fit. For fit, use measurements & tailor review.';

/**
 * Stage-10 try-on + real upload (Feature 3). The photo is uploaded directly to
 * object storage via a presigned URL, then the job runs on the stored key.
 */
export default function TryOnPage() {
  const [consented, setConsented] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState<JobView | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<GarmentOption[]>([]);
  const [productId, setProductId] = useState<string>('');

  const token = () => getAuth().token;

  // Load garments to try on; preselect the one passed via ?productId=.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/products');
        if (!res.ok) return;
        const data = await res.json();
        const items: GarmentOption[] = data.items ?? data;
        setProducts(items);
        const fromQuery =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('productId')
            : null;
        const initial =
          fromQuery && items.some((p) => p.id === fromQuery) ? fromQuery : items[0]?.id;
        if (initial) setProductId(initial);
      } catch {
        /* products are optional to load; the selector just stays empty */
      }
    })();
  }, []);

  const selectedGarment = products.find((p) => p.id === productId);

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
    if (!productId) return setMsg('Please choose a garment to try on.');
    if (!file) return setMsg('Please choose a photo first.');
    setBusy(true);
    setMsg(null);
    setJob(null);
    try {
      const t = token();
      if (!t) throw new Error('Please sign in.');
      const meta = await readImageMeta(file);
      const key = await uploadViaPresign(file, 'tryon', t);

      const res = await fetch('/api/v1/tryon/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({
          productId: productId || undefined,
          inputAssetKey: key,
          imageMeta: { width: meta.width, height: meta.height, hasFullBody: true },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg((data?.reasons ?? [data?.message]).join(' '));
      } else {
        await poll(data.id);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Upload failed.');
    }
    setBusy(false);
  }

  async function poll(id: string) {
    for (let i = 0; i < 10; i++) {
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
    setFile(null);
    setMsg('Your image and result were securely deleted.');
  }

  if (!token()) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-serif text-3xl font-semibold text-ink">Try your style</h1>
        <p className="mt-4 text-muted">
          Please{' '}
          <a href="/login" className="text-brand underline">
            sign in
          </a>{' '}
          to use the style preview.
        </p>
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
          Look only · not a fit
        </span>
      </div>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink">
        Try your style
      </h1>

      <div className="mt-6 rounded-lg border border-line bg-surface p-5">
        <label className="block">
          <span className="text-sm font-medium text-ink">Garment to try on</span>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="mt-2 block w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink"
          >
            {products.length === 0 && <option value="">No garments available</option>}
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        {selectedGarment?.images?.[0]?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selectedGarment.images[0].url}
            alt={selectedGarment.title}
            className="mt-3 h-28 w-24 rounded border border-line object-cover"
          />
        )}

        <label className="mt-5 block">
          <span className="text-sm font-medium text-ink">Full-body photo</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-sm text-muted file:mr-3 file:rounded-sm file:border-0 file:bg-brand file:px-3 file:py-2 file:text-white"
          />
        </label>
        {file && <p className="mt-2 font-mono text-xs text-muted">{file.name}</p>}

        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
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

        <button
          onClick={createJob}
          disabled={!consented || !file || busy}
          className="mt-4 rounded-sm bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-50"
        >
          {busy ? 'Uploading & processing…' : 'Create preview'}
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
                  {job.resultUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.resultUrl}
                      alt="Style preview"
                      className="aspect-[4/5] w-full rounded border border-preview object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/5] items-center justify-center rounded border border-preview bg-preview-tint font-mono text-xs text-preview">
                      style preview
                    </div>
                  )}
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
