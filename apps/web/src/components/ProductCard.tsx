import Link from 'next/link';
import type { ProductListItem } from '@/lib/api';

export function ProductCard({ product }: { product: ProductListItem }) {
  const img = product.images[0];
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded border border-line bg-surface shadow-card transition hover:border-brand"
    >
      <div className="aspect-[4/5] bg-surface-2">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img.url}
            alt={img.alt ?? product.title}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-faint">
            no image
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-faint">
          {product.category.name}
        </p>
        <h3 className="mt-1 font-medium text-ink">{product.title}</h3>
        <p className="mt-1 font-mono text-sm text-brass">
          {product.currency} {Number(product.basePrice).toLocaleString()}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.readySize && (
            <span className="rounded-full bg-fit-tint px-2 py-0.5 font-mono text-[10px] text-fit">
              Ready size
            </span>
          )}
          {product.madeToMeasure && (
            <span className="rounded-full bg-mtm-tint px-2 py-0.5 font-mono text-[10px] text-mtm">
              Made-to-measure
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
