import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema'; // Import the whole schema object

export const auth = betterAuth({
  baseURL: env.ORIGIN || 'http://localhost:5173',
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: schema.schema, // We pass the ACTUAL schema object constant here
  }),
  emailAndPassword: { enabled: true },
  plugins: [
    sveltekitCookies(getRequestEvent)
  ]
});