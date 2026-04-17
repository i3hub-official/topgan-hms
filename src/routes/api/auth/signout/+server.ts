import { auth } from '$lib/server/auth';
import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
  try {
    // Call Better Auth signout
    await auth.api.signOut({
      headers: request.headers,
    });
    
    // Clear the auth cookie
    cookies.delete('auth_token', { path: '/' });
    
    return json({ success: true });
  } catch (error) {
    console.error('Signout error:', error);
    return json({ error: 'Failed to sign out' }, { status: 500 });
  }
}