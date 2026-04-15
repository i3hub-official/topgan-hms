import { auth } from '$lib/auth';
import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
  try {
    await auth.api.signOut({
      headers: request.headers,
    });
    
    cookies.delete('auth_token', { path: '/' });
    
    return json({ success: true });
  } catch (error) {
    return json({ error: 'Logout failed' }, { status: 500 });
  }
}