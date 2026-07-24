import Link from 'next/link';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  let products;
  let categories;
  let error: string | null = null;

  try {
    [products, categories] = await Promise.all([
      api.listProducts({ category: searchParams.category, q: searchParams.q }),
      api.listCategories(),
    ]);
  } catch {
    error = 'Could not load the catalog. Is the API running on port 3001?';
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-brass">Catalog</p>
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">Browse garments</h1>

      {categories && (
        <nav className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/catalog"
            className={`rounded-full border px-3 py-1 font-mono text-xs ${
              !searchParams.category
                ? 'border-brand bg-brand-tint text-brand'
                : 'border-line text-muted hover:border-brand'
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/catalog?category=${c.slug}`}
              className={`rounded-full border px-3 py-1 font-mono text-xs ${
                searchParams.category === c.slug
                  ? 'border-brand bg-brand-tint text-brand'
                  : 'border-line text-muted hover:border-brand'
              }`}
            >
              {c.name} ({c._count.products})
            </Link>
          ))}
        </nav>
      )}

      {error && (
        <div className="mt-8 rounded border-l-[3px] border-crit bg-crit-tint px-4 py-3 text-sm text-ink">
          {error}
        </div>
      )}

      {products && products.items.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {products && products.items.length === 0 && (
        <p className="mt-8 text-muted">No products found. Try seeding demo data.</p>
      )}
    </div>
  );
}
