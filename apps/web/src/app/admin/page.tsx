'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface Overview {
  customers: number;
  products: number;
  revenue: string;
  pendingMeasurementReviews: number;
  activeTryOnJobs: number;
  ordersInProduction: number;
  ordersByStatus: { status: string; _count: number }[];
}
interface Report {
  funnels: Record<string, number>;
  tryOn: { totalCostCents: number; aiCostPerDeliveredOrderCents: number };
  production: { remakeRate: number };
}
interface OrderRow {
  id: string;
  number: string;
  status: string;
  total: string;
  currency: string;
  customer: { fullName: string | null };
}

export default function AdminPage() {
  const [ov, setOv] = useState<Overview | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'auth' | 'forbidden'>('loading');
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('tm_token') : null);

  const load = useCallback(async () => {
    const t = token();
    if (!t) return setStatus('auth');
    const h = { Authorization: `Bearer ${t}` };
    const [oRes, rRes, ordRes] = await Promise.all([
      fetch('/api/v1/admin/overview', { headers: h }),
      fetch('/api/v1/analytics/report', { headers: h }),
      fetch('/api/v1/admin/orders?take=10', { headers: h }),
    ]);
    if (oRes.status === 403) return setStatus('forbidden');
    if (oRes.ok) setOv(await oRes.json());
    if (rRes.ok) setReport(await rRes.json());
    if (ordRes.ok) setOrders(await ordRes.json());
    setStatus('ready');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'auth' || status === 'forbidden')
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-serif text-3xl font-semibold text-ink">Admin</h1>
        <p className="mt-4 text-muted">
          {status === 'auth'
            ? 'Please sign in with an admin role.'
            : 'This area needs an admin / finance / support role.'}
        </p>
      </div>
    );

  const money = (v: string | number) => `PKR ${Number(v).toLocaleString()}`;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/products"
            className="rounded-sm bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong"
          >
            Manage products
          </Link>
          <Link
            href="/admin/rules"
            className="rounded-sm border border-line-strong px-4 py-2 text-sm text-ink transition hover:bg-surface-2"
          >
            Rules
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Revenue" value={ov ? money(ov.revenue) : '—'} />
        <Kpi label="In production" value={ov?.ordersInProduction ?? '—'} />
        <Kpi label="Pending reviews" value={ov?.pendingMeasurementReviews ?? '—'} />
        <Kpi
          label="AI cost / order"
          value={report ? `${(report.tryOn.aiCostPerDeliveredOrderCents / 100).toFixed(2)}` : '—'}
        />
      </div>

      {report && (
        <div className="mt-8 rounded-lg border border-line bg-surface p-5">
          <p className="mb-4 font-mono text-xs uppercase tracking-wide text-faint">
            Conversion funnel
          </p>
          <div className="flex flex-col gap-2">
            {[
              ['Product views', report.funnels.productViews],
              ['Configurator start', report.funnels.configuratorStarts],
              ['Configurator done', report.funnels.configuratorCompletions],
              ['Try-on success', report.funnels.tryOnSuccess],
              ['Order placed', report.funnels.productViews && report.funnels.tryOnSuccess],
            ].map(([label, v]) => {
              const max = report.funnels.productViews || 1;
              const val = Number(v ?? 0);
              return (
                <div key={String(label)} className="flex items-center gap-3">
                  <span className="w-36 text-xs text-muted">{label}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-surface-2">
                    <div
                      className="h-full rounded bg-brand"
                      style={{ width: `${Math.max(4, (val / max) * 100)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-xs text-brass">{val}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 font-mono text-xs text-muted">
            Remake rate <b className="text-ink">{report.production.remakeRate}%</b> · Try-on cost
            total <b className="text-ink">{money(report.tryOn.totalCostCents / 100)}</b>
          </p>
        </div>
      )}

      <div className="mt-8 overflow-auto rounded-lg border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase text-faint">
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line text-muted">
                <td className="p-3 font-medium text-ink">{o.number}</td>
                <td className="p-3">{o.customer.fullName ?? '—'}</td>
                <td className="p-3 font-mono text-xs">{o.status}</td>
                <td className="p-3 text-right font-mono tabular-nums">
                  {o.currency} {Number(o.total).toLocaleString()}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td className="p-3 text-muted" colSpan={4}>
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="font-mono text-[10px] uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}
