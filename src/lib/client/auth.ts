// Client-side auth helpers

// src/lib/client/auth.ts
export async function signOut() {
  await fetch('/api/auth/sign-out', {
    method: 'POST',
  });
  window.location.href = '/login';
}

export async function getSession() {
  const res = await fetch('/api/auth/session');
  return res.json();
}