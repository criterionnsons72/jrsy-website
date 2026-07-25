'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
}
interface ConfigSchema {
  id: string;
  name: string;
}
interface ProductImage {
  id: string;
  url: string;
}
interface AdminProduct {
  id: string;
  title: string;
  slug: string;
  basePrice: string;
  currency: string;
  description: string | null;
  madeToMeasure: boolean;
  readySize: boolean;
  isActive: boolean;
  configSchemaId: string | null;
  category: { id: string; name: string } | null;
  images: ProductImage[];
}

const PLACEHOLDERS = [
  { label: 'Kurta', url: '/products/placeholder-kurta.svg' },
  { label: 'Shirt', url: '/products/placeholder-shirt.svg' },
  { label: 'Suit', url: '/products/placeholder-suit.svg' },
  { label: 'Generic', url: '/products/placeholder-generic.svg' },
];

const EMPTY = {
  title: '',
  slug: '',
  categoryId: '',
  basePrice: '',
  currency: 'PKR',
  description: '',
  madeToMeasure: true,
  readySize: true,
  configSchemaId: '',
  images: [] as string[],
};
type FormState = typeof EMPTY;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [schemas, setSchemas] = useState<ConfigSchema[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'auth' | 'forbidden'>('loading');
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageInput, setImageInput] = useState('');

  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('tm_token') : null);

  const load = useCallback(async () => {
    const t = token();
    if (!t) return setStatus('auth');
    const h = { Authorization: `Bearer ${t}` };
    const [pRes, cRes, sRes] = await Promise.all([
      fetch('/api/v1/admin/products', { headers: h }),
      fetch('/api/v1/categories'),
      fetch('/api/v1/admin/config-schemas', { headers: h }),
    ]);
    if (pRes.status === 401) return setStatus('auth');
    if (pRes.status === 403) return setStatus('forbidden');
    if (pRes.ok) setProducts(await pRes.json());
    if (cRes.ok) setCategories(await cRes.json());
    if (sRes.ok) setSchemas(await sRes.json());
    setStatus('ready');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(false);
    setError(null);
    setImageInput('');
  }

  function startAdd() {
    setForm({
      ...EMPTY,
      configSchemaId: schemas[0]?.id ?? '',
      categoryId: categories[0]?.id ?? '',
    });
    setEditingId(null);
    setError(null);
    setShowForm(true);
  }

  function startEdit(p: AdminProduct) {
    setForm({
      title: p.title,
      slug: p.slug,
      categoryId: p.category?.id ?? '',
      basePrice: p.basePrice,
      currency: p.currency,
      description: p.description ?? '',
      madeToMeasure: p.madeToMeasure,
      readySize: p.readySize,
      configSchemaId: p.configSchemaId ?? '',
      images: p.images.map((i) => i.url),
    });
    setEditingId(p.id);
    setError(null);
    setShowForm(true);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function addImage(url: string) {
    const u = url.trim();
    if (u && !form.images.includes(u)) setForm((f) => ({ ...f, images: [...f.images, u] }));
    setImageInput('');
  }

  async function save() {
    setError(null);
    if (!form.title.trim()) return setError('Title is required.');
    if (!form.categoryId) return setError('Please choose a category.');
    const price = Number(form.basePrice);
    if (!(price >= 0)) return setError('Base price must be a number.');

    setSaving(true);
    const t = token();
    const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` };
    const body = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      categoryId: form.categoryId,
      basePrice: price,
      currency: form.currency || 'PKR',
      description: form.description.trim() || undefined,
      madeToMeasure: form.madeToMeasure,
      readySize: form.readySize,
      configSchemaId: form.configSchemaId || undefined,
      images: form.images,
    };
    try {
      const res = editingId
        ? await fetch(`/api/v1/admin/products/${editingId}`, {
            method: 'PATCH',
            headers: h,
            body: JSON.stringify(body),
          })
        : await fetch('/api/v1/admin/products', {
            method: 'POST',
            headers: h,
            body: JSON.stringify(body),
          });
      if (res.ok) {
        resetForm();
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Could not save the product. Is the slug unique?');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: AdminProduct) {
    const t = token();
    await fetch(`/api/v1/admin/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    await load();
  }

  async function remove(p: AdminProduct) {
    if (typeof window !== 'undefined' && !window.confirm(`Remove "${p.title}"?`)) return;
    const t = token();
    await fetch(`/api/v1/admin/products/${p.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${t}` },
    });
    await load();
  }

  if (status === 'auth') {
    return (
      <Gate>
        Please{' '}
        <Link href="/login" className="text-brand underline">
          sign in
        </Link>{' '}
        as an administrator.
      </Gate>
    );
  }
  if (status === 'forbidden') {
    return (
      <Gate>
        Your account does not have catalog access. Ask an administrator to grant you the{' '}
        <span className="font-mono">catalog_manager</span> role.
      </Gate>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="font-mono text-xs text-muted hover:text-ink">
            ← Admin
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-ink">
            Products
          </h1>
        </div>
        {!showForm && (
          <button
            onClick={startAdd}
            className="rounded-sm bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
          >
            + Add product
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-6 rounded-lg border border-line bg-surface p-5 shadow-card">
          <p className="font-serif text-lg font-semibold text-ink">
            {editingId ? 'Edit product' : 'New product'}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <input
                className={inputCls}
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    title: e.target.value,
                    slug: editingId ? f.slug : slugify(e.target.value),
                  }))
                }
                placeholder="e.g. Embroidered Kurta"
              />
            </Field>
            <Field label="Web address (slug)">
              <input
                className={inputCls}
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="embroidered-kurta"
              />
            </Field>
            <Field label="Category">
              <select
                className={inputCls}
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">— choose —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Base price (${form.currency})`}>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={form.basePrice}
                onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                placeholder="4500"
              />
            </Field>
            <Field label="Description" full>
              <textarea
                className={`${inputCls} min-h-20`}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description shown on the product page."
              />
            </Field>
            <Field label="Configuration schema (makes it customisable)">
              <select
                className={inputCls}
                value={form.configSchemaId}
                onChange={(e) => setForm((f) => ({ ...f, configSchemaId: e.target.value }))}
              >
                <option value="">— none —</option>
                {schemas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end gap-5">
              <label className="flex items-center gap-2 font-mono text-xs text-ink">
                <input
                  type="checkbox"
                  checked={form.madeToMeasure}
                  onChange={(e) => setForm((f) => ({ ...f, madeToMeasure: e.target.checked }))}
                />
                Made-to-measure
              </label>
              <label className="flex items-center gap-2 font-mono text-xs text-ink">
                <input
                  type="checkbox"
                  checked={form.readySize}
                  onChange={(e) => setForm((f) => ({ ...f, readySize: e.target.checked }))}
                />
                Ready size
              </label>
            </div>
          </div>

          {/* Images */}
          <div className="mt-5">
            <p className="mb-2 font-mono text-xs uppercase tracking-wide text-faint">Images</p>
            <div className="flex flex-wrap gap-3">
              {form.images.map((url) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-24 w-20 rounded border border-line object-cover"
                  />
                  <button
                    onClick={() =>
                      setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }))
                    }
                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-crit text-xs text-white"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-muted">Quick add:</span>
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.url}
                  onClick={() => addImage(p.url)}
                  className="rounded-full border border-line-strong px-2.5 py-1 font-mono text-[11px] text-ink hover:border-brand"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                className={inputCls}
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="…or paste an image URL"
              />
              <button
                onClick={() => addImage(imageInput)}
                className="shrink-0 rounded-sm border border-line-strong px-3 py-2 font-mono text-xs text-ink hover:border-brand"
              >
                Add
              </button>
            </div>
          </div>

          {error && <p className="mt-4 font-mono text-xs text-crit">{error}</p>}

          <div className="mt-5 flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-sm bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}
            </button>
            <button
              onClick={resetForm}
              className="rounded-sm border border-line-strong px-5 py-2.5 text-sm text-ink hover:bg-surface-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="mt-8 flex flex-col gap-3">
        {status === 'loading' && <p className="font-mono text-sm text-muted">Loading…</p>}
        {status === 'ready' && products.length === 0 && (
          <p className="font-mono text-sm text-muted">No products yet. Click “Add product”.</p>
        )}
        {products.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-4 rounded-lg border border-line bg-surface p-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.images[0]?.url ?? '/products/placeholder-generic.svg'}
              alt=""
              className="h-16 w-14 shrink-0 rounded border border-line object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-ink">{p.title}</p>
                {!p.isActive && (
                  <span className="rounded-full bg-crit-tint px-2 py-0.5 font-mono text-[10px] text-crit">
                    hidden
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-muted">
                {p.currency} {Number(p.basePrice).toLocaleString()} · {p.category?.name ?? '—'}
                {p.configSchemaId ? ' · customisable' : ' · not customisable'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => toggleActive(p)}
                className="rounded-sm border border-line-strong px-3 py-1.5 font-mono text-xs text-ink hover:bg-surface-2"
              >
                {p.isActive ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={() => startEdit(p)}
                className="rounded-sm border border-line-strong px-3 py-1.5 font-mono text-xs text-ink hover:bg-surface-2"
              >
                Edit
              </button>
              <button
                onClick={() => remove(p)}
                className="rounded-sm border border-crit px-3 py-1.5 font-mono text-xs text-crit hover:bg-crit-tint"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none';

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="font-mono text-xs uppercase tracking-wide text-faint">{label}</span>
      {children}
    </label>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <div className="rounded-lg border border-line bg-surface p-6 font-mono text-sm text-ink">
        {children}
      </div>
    </div>
  );
}
