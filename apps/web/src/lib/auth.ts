'use client';

/**
 * Minimal client-side auth state for the PWA. The access token is kept in
 * localStorage and attached as a Bearer header by the pages that call the API.
 * (A production hardening step can move this to httpOnly cookies + CSRF.)
 */

const TOKEN_KEY = 'tm_token';
const EMAIL_KEY = 'tm_email';

export interface AuthState {
  token: string | null;
  email: string | null;
}

export function getAuth(): AuthState {
  if (typeof window === 'undefined') return { token: null, email: null };
  return {
    token: localStorage.getItem(TOKEN_KEY),
    email: localStorage.getItem(EMAIL_KEY),
  };
}

export function setAuth(token: string, email: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
  window.dispatchEvent(new Event('tm-auth-changed'));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  window.dispatchEvent(new Event('tm-auth-changed'));
}

/** POST helper for the two credential endpoints. */
export async function authRequest(
  path: 'login' | 'register',
  body: { email: string; password: string; fullName?: string },
): Promise<{ ok: boolean; error?: string; token?: string; email?: string }> {
  try {
    const res = await fetch(`/api/v1/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
      return { ok: false, error: msg ?? 'Something went wrong.' };
    }
    return { ok: true, token: data.accessToken, email: data.user?.email };
  } catch {
    return { ok: false, error: 'Could not reach the server. Is the API running?' };
  }
}
