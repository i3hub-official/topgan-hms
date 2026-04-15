import { auth } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // 1. Get the session
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  // 2. Set locals for use in load functions and pages
  event.locals.user = session?.user;
  event.locals.session = session?.session;

  // 3. Route Protection
  const protectedRoutes = ['/dashboard', '/rooms', '/inventory', '/power', '/audit'];
  const isProtected = protectedRoutes.some(route => event.url.pathname.startsWith(route));
  
  if (isProtected && !event.locals.user) {
    throw redirect(303, '/login');
  }

  if (event.url.pathname === '/login' && event.locals.user) {
    throw redirect(303, '/dashboard');
  }

  return await resolve(event);
};