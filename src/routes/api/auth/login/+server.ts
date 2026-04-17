// src/routes/api/auth/login/+server.ts

import { auth } from '$lib/server/auth';
import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
  try {
    const { email, password } = await request.json();
    
    const response = await auth.api.signInEmail({
      body: { email, password },
      headers: request.headers,
    });
    
    // Set session cookie
    if (response?.session?.token) {
      cookies.set('auth_token', response.session.token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
    
    return json({ success: true });
  } catch (error) {
    return json({ error: 'Invalid email or password' }, { status: 401 });
  }
}