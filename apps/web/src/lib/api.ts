/**
 * Tiny API client for the NestJS backend.
 * Server components call these with the absolute API URL; client components
 * use the same base and attach a bearer token when present.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const PREFIX = '/api/v1';

export interface ProductListItem {
  id: string;
  title: string;
  slug: string;
  basePrice: string;
  currency: string;
  madeToMeasure: boolean;
  readySize: boolean;
  category: { name: string; slug: string };
  images: { url: string; alt: string | null }[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  variants: { id: string; sku: string; sizeLabel: string | null; priceDelta: string }[];
  fabrics: { fabric: { id: string; name: string; pricePerUnit: string; colorHex: string | null } }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${PREFIX}${path}`, {
    // Catalog is cacheable; revalidate periodically.
    next: { revalidate: 60 },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listProducts: (params: { category?: string; q?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.q) qs.set('q', params.q);
    if (params.page) qs.set('page', String(params.page));
    const suffix = qs.toString() ? `?${qs}` : '';
    return get<Paginated<ProductListItem>>(`/products${suffix}`);
  },
  getProduct: (slug: string) => get<ProductDetail>(`/products/${slug}`),
  listCategories: () => get<Category[]>('/categories'),
};

export { API_BASE, PREFIX };
