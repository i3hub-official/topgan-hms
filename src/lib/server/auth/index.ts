import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
// 1. Import your schema objects
import * as schema from '$lib/server/db/schema'; 

export const auth = betterAuth({
  baseURL: env.ORIGIN || 'http://localhost:5173',
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    // 2. Pass the imported schema object, NOT strings
    schema: schema,
  }),
  emailAndPassword: { enabled: true },
  plugins: [sveltekitCookies(getRequestEvent)],
});