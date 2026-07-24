'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CartItem {
  id: string;
  quantity: number;
  unitPrice: string;
  product: { title: string; slug: string };
  fitPreference: string | null;
}
interface Cart {
  id: string;
  items: CartItem[];
  currency: string;
  subtotal: string;
  itemCount: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'auth' | 'error'>('loading');

  async function load() {
    const token = localStorage.getItem('tm_token');
    if (!token) {
      setStatus('auth');
      return;
    }
    try {
      const res = await fetch('/api/v1/cart', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setCart(await res.json());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">Your cart</h1>

      {status === 'auth' && (
        <p className="mt-6 text-muted">
          Please{' '}
          <Link href="/login" className="text-brand underline">
            sign in
          </Link>{' '}
          to view your cart.
        </p>
      )}
      {status === 'loading' && <p className="mt-6 text-muted">Loading…</p>}
      {status === 'error' && <p className="mt-6 text-crit">Could not load your cart.</p>}

      {status === 'ready' && cart && (
        <div className="mt-6">
          {cart.items.length === 0 ? (
            <p className="text-muted">
              Your cart is empty.{' '}
              <Link href="/catalog" className="text-brand underline">
                Browse the catalog
              </Link>
              .
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {cart.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded border border-line bg-surface px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-ink">{item.product.title}</p>
                      <p className="font-mono text-xs text-muted">
                        Qty {item.quantity}
                        {item.fitPreference ? ` · ${item.fitPreference}` : ''}
                      </p>
                    </div>
                    <p className="font-mono text-brass">
                      {cart.currency} {Number(item.unitPrice).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                <span className="font-mono text-sm text-muted">Subtotal ({cart.itemCount} items)</span>
                <span className="font-mono text-lg text-brass">
                  {cart.currency} {Number(cart.subtotal).toLocaleString()}
                </span>
              </div>
              <p className="mt-4 font-mono text-xs text-faint">
                Checkout (address, shipping, tax, measurement approval, policy) arrives in a later
                stage.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
