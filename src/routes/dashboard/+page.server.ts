import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  // Protect the dashboard route
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  return {
    user: locals.user
  };
};