import { auth } from '$lib/server/auth';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // 1. Invalidate session on the auth provider
    await auth.api.signOut({
      headers: request.headers,
    });
    
    // 2. Clear the local cookie
    cookies.delete('auth_token', { 
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
    
    return json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return json({ error: 'Logout failed' }, { status: 500 });
  }
};