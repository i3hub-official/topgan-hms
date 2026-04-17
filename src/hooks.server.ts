// src/hooks.server.ts


import { auth } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Get the session using the auth API with cookies from request
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  // Set locals for use in load functions and pages
  event.locals.user = session?.user ?? null;
  event.locals.session = session?.session ?? null;

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/login', '/api/auth/signin', '/api/seed'];
  const isPublicRoute = publicRoutes.some(route => event.url.pathname.startsWith(route));
  
  // Protect all other routes
  if (!isPublicRoute && !event.locals.user) {
    throw redirect(303, '/login');
  }

  // Redirect to dashboard if already logged in and trying to access login page
  if (event.url.pathname === '/login' && event.locals.user) {
    throw redirect(303, '/dashboard');
  }

  return await resolve(event);
};