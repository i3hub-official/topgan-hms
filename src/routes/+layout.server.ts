import type { LayoutServerLoad } from './$types';


export const prerender = false;
export const ssr = true;
export const load: LayoutServerLoad = async ({ locals }) => {
 


  return {
    user: locals.user,
    session: locals.session
  };
};