'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authRequest, setAuth } from '@/lib/auth';

/** Shared sign-in / register form. */
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await authRequest(mode, {
      email,
      password,
      ...(isRegister ? { fullName } : {}),
    });
    setBusy(false);
    if (!res.ok || !res.token) {
      setError(res.error ?? 'Failed.');
      return;
    }
    setAuth(res.token, res.email ?? email);
    router.push('/account/profiles');
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-brass">
        {isRegister ? 'Create account' : 'Welcome back'}
      </p>
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">
        {isRegister ? 'Join Tailor Master' : 'Sign in'}
      </h1>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        {isRegister && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Full name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-sm border border-line-strong bg-surface px-3 py-2.5 text-ink"
              placeholder="Ayesha Khan"
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-sm border border-line-strong bg-surface px-3 py-2.5 text-ink"
            placeholder="you@example.com"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-sm border border-line-strong bg-surface px-3 py-2.5 text-ink"
            placeholder="at least 8 characters"
          />
        </label>

        {error && (
          <p className="rounded-sm border-l-[3px] border-crit bg-crit-tint px-3 py-2 text-xs text-ink">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-sm bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-50"
        >
          {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {isRegister ? 'Already have an account? ' : 'New here? '}
        <Link href={isRegister ? '/login' : '/register'} className="text-brand underline">
          {isRegister ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </div>
  );
}
