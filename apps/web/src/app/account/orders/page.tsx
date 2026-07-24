'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getAuth } from '@/lib/auth';

interface OrderRow {
  id: string;
  number: string;
  status: string;
  total: string;
  currency: string;
  createdAt: string;
}

const STAGES = [
  'payment_complete',
  'measurement_locked',
  'pattern_preparation',
  'fabric_allocation',
  'cutting',
  'stitching',
  'quality_control',
  'packing',
  'dispatch',
  'delivered',
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'auth'>('loading');

  const load = useCallback(async () => {
    const t = getAuth().token;
    if (!t) return setStatus('auth');
    const res = await fetch('/api/v1/orders', { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) setOrders(await res.json());
    setStatus('ready');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'auth')
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-serif text-3xl font-semibold text-ink">Orders</h1>
        <p className="mt-4 text-muted">
          Please{' '}
          <Link href="/login" className="text-brand underline">
            sign in
          </Link>{' '}
          to see your orders.
        </p>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">Your orders</h1>
      {orders.length === 0 ? (
        <p className="mt-4 text-muted">
          No orders yet.{' '}
          <Link href="/catalog" className="text-brand underline">
            Start shopping
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {orders.map((o) => {
            const idx = STAGES.indexOf(o.status);
            const pct = idx < 0 ? 0 : ((idx + 1) / STAGES.length) * 100;
            return (
              <li key={o.id}>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="block rounded-lg border border-line bg-surface p-4 hover:border-brand"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">{o.number}</span>
                    <span className="font-mono text-brass">
                      {o.currency} {Number(o.total).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted">{o.status.replace(/_/g, ' ')}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded bg-surface-2">
                    <div className="h-full rounded bg-brand" style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
