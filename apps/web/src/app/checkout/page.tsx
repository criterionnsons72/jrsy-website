'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth } from '@/lib/auth';

interface CartItem {
  id: string;
  quantity: number;
  unitPrice: string;
  variantId: string | null;
  product: { title: string };
}
interface Cart {
  items: CartItem[];
  currency: string;
  subtotal: string;
}

const SHIP = { standard: 250, express: 750 };

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'auth' | 'empty'>('loading');
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    line: '',
    city: '',
    postalCode: '',
  });
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [measurementApproved, setMeasurementApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const token = () => getAuth().token;

  const load = useCallback(async () => {
    const t = token();
    if (!t) return setStatus('auth');
    const res = await fetch('/api/v1/cart', { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return setStatus('empty');
    const data: Cart = await res.json();
    if (data.items.length === 0) return setStatus('empty');
    setCart(data);
    setStatus('ready');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasMTM = cart?.items.some((i) => !i.variantId) ?? false;
  const subtotal = cart ? Number(cart.subtotal) : 0;
  const shipping = SHIP[shippingMethod];
  const total = subtotal + shipping;

  async function place() {
    setError(null);
    if (!acceptPolicy) return setError('Please accept the custom-order policy.');
    if (hasMTM && !measurementApproved) return setError('Please confirm your measurements.');
    setBusy(true);
    const res = await fetch('/api/v1/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        address,
        shippingMethod,
        paymentMethod,
        acceptPolicy,
        measurementApproved,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(
        Array.isArray(data?.message)
          ? data.message.join(' ')
          : (data?.message ?? 'Checkout failed.'),
      );
      return;
    }
    router.push(`/account/orders/${data.orderId}?placed=1`);
  }

  if (status === 'auth')
    return (
      <Wrap>
        <p className="text-muted">
          Please{' '}
          <Link href="/login" className="text-brand underline">
            sign in
          </Link>{' '}
          to check out.
        </p>
      </Wrap>
    );
  if (status === 'empty')
    return (
      <Wrap>
        <p className="text-muted">
          Your cart is empty.{' '}
          <Link href="/catalog" className="text-brand underline">
            Browse the catalog
          </Link>
          .
        </p>
      </Wrap>
    );

  return (
    <Wrap>
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">Checkout</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-5">
          <Section title="1 · Address">
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['fullName', 'Full name'],
                  ['phone', 'Phone'],
                  ['line', 'Address'],
                  ['city', 'City'],
                  ['postalCode', 'Postal code (optional)'],
                ] as const
              ).map(([k, label]) => (
                <input
                  key={k}
                  placeholder={label}
                  value={address[k]}
                  onChange={(e) => setAddress((a) => ({ ...a, [k]: e.target.value }))}
                  className="rounded-sm border border-line-strong bg-surface px-3 py-2 text-ink"
                />
              ))}
            </div>
          </Section>

          <Section title="2 · Shipping">
            {(['standard', 'express'] as const).map((m) => (
              <label key={m} className="flex items-center gap-2 py-1 text-sm">
                <input
                  type="radio"
                  checked={shippingMethod === m}
                  onChange={() => setShippingMethod(m)}
                />
                <span className="capitalize">{m}</span>
                <span className="font-mono text-xs text-muted">PKR {SHIP[m]}</span>
              </label>
            ))}
          </Section>

          <Section title="3 · Payment">
            {(['card', 'cod'] as const).map((m) => (
              <label key={m} className="flex items-center gap-2 py-1 text-sm">
                <input
                  type="radio"
                  checked={paymentMethod === m}
                  onChange={() => setPaymentMethod(m)}
                />
                {m === 'card' ? 'Card (mock)' : 'Cash on delivery'}
              </label>
            ))}
          </Section>

          {hasMTM && (
            <Section title="4 · Measurement approval">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={measurementApproved}
                  onChange={(e) => setMeasurementApproved(e.target.checked)}
                  className="mt-1"
                />
                I confirm my measurements are correct &amp; final for the made-to-measure items.
              </label>
            </Section>
          )}

          <Section title="Custom-order policy">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={acceptPolicy}
                onChange={(e) => setAcceptPolicy(e.target.checked)}
                className="mt-1"
              />
              I accept that made-to-order items are non-returnable except for defects.
            </label>
            <p className="mt-2 font-mono text-[11px] text-warn">
              Legal copy placeholder — requires qualified-lawyer review.
            </p>
          </Section>

          {error && (
            <p className="rounded-sm border-l-[3px] border-crit bg-crit-tint px-3 py-2 text-sm text-ink">
              {error}
            </p>
          )}
        </div>

        <aside className="h-fit lg:sticky lg:top-20">
          <div className="rounded-lg border border-line bg-surface p-4">
            <p className="font-mono text-xs uppercase tracking-wide text-faint">Order review</p>
            <div className="mt-3 flex flex-col gap-1.5 font-mono text-xs text-muted">
              <Row label="Subtotal" value={`${subtotal.toLocaleString()}`} />
              <Row label="Shipping" value={`${shipping}`} />
              <Row label="Total" value={`${cart?.currency} ${total.toLocaleString()}`} strong />
            </div>
            <button
              onClick={place}
              disabled={busy}
              className="mt-4 w-full rounded-sm bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-50"
            >
              {busy ? 'Placing order…' : 'Place order'}
            </button>
          </div>
        </aside>
      </div>
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl px-5 py-12">{children}</div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="mb-3 font-mono text-xs uppercase tracking-wide text-faint">{title}</p>
      {children}
    </div>
  );
}
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'text-ink' : ''}`}>
      <span>{label}</span>
      <span className={strong ? 'font-semibold text-brass' : ''}>{value}</span>
    </div>
  );
}
