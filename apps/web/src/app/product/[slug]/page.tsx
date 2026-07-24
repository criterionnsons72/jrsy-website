import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, type ProductDetail } from '@/lib/api';
import { AddToCart } from '@/components/AddToCart';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  let product: ProductDetail;
  try {
    product = await api.getProduct(params.slug);
  } catch {
    notFound();
  }

  const img = product.images[0];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <Link href="/catalog" className="font-mono text-xs text-muted hover:text-ink">
        ← Back to catalog
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* Gallery — real product photos stay visible (Stage 1 principle). */}
        <div className="flex flex-col gap-3">
          <div className="aspect-[4/5] overflow-hidden rounded-lg bg-surface-2">
            {img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img.url} alt={img.alt ?? product.title} className="h-full w-full object-cover" />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((im, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={im.url} alt="" className="aspect-square w-full rounded object-cover" />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-faint">
            {product.category.name}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-ink">
            {product.title}
          </h1>
          <p className="mt-3 font-mono text-xl text-brass">
            {product.currency} {Number(product.basePrice).toLocaleString()}
            <span className="ml-2 text-xs text-muted">from · price updates with options</span>
          </p>

          {product.description && <p className="mt-4 text-muted">{product.description}</p>}

          {/* Fit choice — the three promises, kept distinct */}
          <div className="mt-6 flex flex-wrap gap-2">
            {product.readySize && (
              <span className="rounded-full bg-fit-tint px-3 py-1 font-mono text-xs text-fit">
                Ready size — with recommendation
              </span>
            )}
            {product.madeToMeasure && (
              <span className="rounded-full bg-mtm-tint px-3 py-1 font-mono text-xs text-mtm">
                Made-to-measure — your measurements
              </span>
            )}
          </div>

          {/* Fabrics */}
          {product.fabrics.length > 0 && (
            <div className="mt-6">
              <p className="font-mono text-xs uppercase tracking-wide text-faint">Fabric</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {product.fabrics.map(({ fabric }) => (
                  <div key={fabric.id} className="flex items-center gap-2">
                    <span
                      className="h-6 w-6 rounded border border-line-strong"
                      style={{ background: fabric.colorHex ?? '#ddd' }}
                    />
                    <span className="text-sm text-muted">
                      {fabric.name}
                      {Number(fabric.pricePerUnit) > 0 && (
                        <span className="text-faint"> +{Number(fabric.pricePerUnit)}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.variants.length > 0 && (
            <div className="mt-6">
              <p className="font-mono text-xs uppercase tracking-wide text-faint">Ready size</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <span
                    key={v.id}
                    className="rounded border border-line-strong px-3 py-1 font-mono text-sm text-ink"
                  >
                    {v.sizeLabel}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <Link
              href={`/product/${product.slug}/configure`}
              className="mb-3 inline-block rounded-sm bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong"
            >
              Customize this garment →
            </Link>
            <AddToCart productId={product.id} />
            <p className="mt-3 border-l-[3px] border-preview bg-preview-tint px-3 py-2 text-xs text-ink">
              Style Preview (coming next) shows look only — not a guaranteed fit. For fit, use
              measurements &amp; tailor review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
