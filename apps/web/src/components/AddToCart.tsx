'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Stage 7 add-to-cart. The cart API requires an authenticated customer.
 * A full sign-in UI + checkout arrive in the next stage; for now this posts
 * with a bearer token from localStorage and guides the user if absent.
 */
export function AddToCart({ productId }: { productId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'auth' | 'error'>('idle');

  async function add() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tm_token') : null;
    if (!token) {
      setState('auth');
      return;
    }
    setState('loading');
    try {
      const res = await fetch('/api/v1/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={add}
          disabled={state === 'loading'}
          className="rounded-sm bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-50"
        >
          {state === 'loading' ? 'Adding…' : 'Add to cart'}
        </button>
        <button className="rounded-sm bg-brass px-5 py-3 text-sm font-semibold text-white transition hover:bg-brass-strong">
          ◇ Try your style
        </button>
      </div>
      {state === 'done' && (
        <p className="font-mono text-xs text-good">
          Added ·{' '}
          <Link href="/cart" className="underline">
            view cart
          </Link>
        </p>
      )}
      {state === 'auth' && (
        <p className="font-mono text-xs text-warn">Please sign in to add items (sign-in UI coming next stage).</p>
      )}
      {state === 'error' && (
        <p className="font-mono text-xs text-crit">Could not add to cart — please try again.</p>
      )}
    </div>
  );
}
