'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getAuth } from '@/lib/auth';

interface Item {
  id: string;
  title: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}
interface Order {
  id: string;
  number: string;
  status: string;
  currency: string;
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  items: Item[];
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const placed = useSearchParams().get('placed') === '1';
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'auth' | 'error'>('loading');

  const load = useCallback(async () => {
    const t = getAuth().token;
    if (!t) return setStatus('auth');
    const res = await fetch(`/api/v1/orders/${params.id}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) return setStatus('error');
    setOrder(await res.json());
    setStatus('ready');
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'auth')
    return (
      <Wrap>
        <p className="text-muted">
          Please{' '}
          <Link href="/login" className="text-brand underline">
            sign in
          </Link>
          .
        </p>
      </Wrap>
    );
  if (status === 'error')
    return (
      <Wrap>
        <p className="text-crit">Order not found.</p>
      </Wrap>
    );
  if (!order) return <Wrap>Loading…</Wrap>;

  return (
    <Wrap>
      {placed && (
        <div className="mb-6 rounded-lg border-l-[3px] border-good bg-good-tint px-4 py-3 text-sm text-ink">
          🎉 Order placed! We&apos;ll keep you posted as it moves through production.
        </div>
      )}
      <Link href="/account/orders" className="font-mono text-xs text-muted hover:text-ink">
        ← All orders
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink">{order.number}</h1>
      <p className="mt-1 font-mono text-sm text-muted">{order.status.replace(/_/g, ' ')}</p>

      <ul className="mt-6 flex flex-col gap-2">
        {order.items.map((i) => (
          <li
            key={i.id}
            className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3"
          >
            <span className="text-ink">
              {i.title} <span className="font-mono text-xs text-muted">×{i.quantity}</span>
            </span>
            <span className="font-mono text-brass">
              {order.currency} {Number(i.lineTotal).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 font-mono text-sm text-muted">
        <Row label="Subtotal" v={`${order.currency} ${Number(order.subtotal).toLocaleString()}`} />
        <Row label="Shipping" v={`${order.currency} ${Number(order.shipping).toLocaleString()}`} />
        <Row label="Tax" v={`${order.currency} ${Number(order.tax).toLocaleString()}`} />
        <Row label="Total" v={`${order.currency} ${Number(order.total).toLocaleString()}`} strong />
      </div>
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-2xl px-5 py-12">{children}</div>;
}
function Row({ label, v, strong }: { label: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'text-ink' : ''}`}>
      <span>{label}</span>
      <span className={strong ? 'font-semibold text-brass' : ''}>{v}</span>
    </div>
  );
}
