'use client';

import { useCallback, useEffect, useState } from 'react';

interface Task {
  orderId: string;
  code: string;
  stage: string;
  operatorId: string | null;
  priority: number;
  dueAt: string | null;
  delayed: boolean;
  order: { number: string };
}

const LABEL: Record<string, string> = {
  measurement_locked: 'Locked',
  pattern_preparation: 'Pattern',
  fabric_allocation: 'Fabric',
  cutting: 'Cutting',
  stitching: 'Stitching',
  quality_control: 'QC',
  packing: 'Packing',
  dispatch: 'Dispatch',
  delivered: 'Delivered',
};
const NEXT: Record<string, string> = {
  measurement_locked: 'pattern_preparation',
  pattern_preparation: 'fabric_allocation',
  fabric_allocation: 'cutting',
  cutting: 'stitching',
  stitching: 'quality_control',
  packing: 'dispatch',
  dispatch: 'delivered',
};

export default function WorkshopPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'auth' | 'forbidden'>('loading');
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('tm_token') : null);

  const load = useCallback(async () => {
    const t = token();
    if (!t) return setStatus('auth');
    const res = await fetch('/api/v1/production/queue', {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.status === 403) return setStatus('forbidden');
    if (!res.ok) return setStatus('forbidden');
    setTasks(await res.json());
    setStatus('ready');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function advance(orderId: string, to: string) {
    await fetch(`/api/v1/production/orders/${orderId}/advance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ to }),
    });
    await load();
  }

  async function qc(orderId: string, pass: boolean) {
    await fetch(`/api/v1/production/orders/${orderId}/qc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ pass, notes: pass ? undefined : 'Rework required' }),
    });
    await load();
  }

  if (status === 'auth' || status === 'forbidden')
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-serif text-3xl font-semibold text-ink">Workshop</h1>
        <p className="mt-4 text-muted">
          {status === 'auth'
            ? 'Please sign in as a workshop operator / production manager.'
            : 'This area needs a workshop / production role. Assign one to your user to access it.'}
        </p>
      </div>
    );

  const delayed = tasks.filter((t) => t.delayed).length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">
        Production queue
      </h1>
      <div className="mt-3 flex flex-wrap gap-2">
        {delayed > 0 && (
          <span className="rounded-full bg-crit-tint px-3 py-1 font-mono text-xs text-crit">
            {delayed} delayed
          </span>
        )}
        <span className="rounded-full bg-good-tint px-3 py-1 font-mono text-xs text-good">
          {tasks.length} in production
        </span>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {tasks.map((t) => (
          <li key={t.orderId} className="rounded-lg border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{t.order.number}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-tint px-2 py-0.5 font-mono text-[10px] text-brand">
                    {LABEL[t.stage] ?? t.stage}
                  </span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-muted">
                    {t.operatorId ? 'Assigned' : 'Unassigned'}
                  </span>
                  {t.delayed && (
                    <span className="rounded-full bg-crit-tint px-2 py-0.5 font-mono text-[10px] text-crit">
                      Overdue
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {t.stage === 'quality_control' ? (
                  <>
                    <button
                      onClick={() => qc(t.orderId, true)}
                      className="rounded-sm bg-good px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => qc(t.orderId, false)}
                      className="rounded-sm border border-crit px-3 py-1.5 text-xs text-crit"
                    >
                      Fail
                    </button>
                  </>
                ) : NEXT[t.stage] ? (
                  <button
                    onClick={() => advance(t.orderId, NEXT[t.stage])}
                    className="rounded-sm bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-strong"
                  >
                    → {LABEL[NEXT[t.stage]]}
                  </button>
                ) : (
                  <span className="font-mono text-xs text-good">Delivered</span>
                )}
              </div>
            </div>
          </li>
        ))}
        {tasks.length === 0 && <p className="text-muted">No orders in production yet.</p>}
      </ul>
    </div>
  );
}
