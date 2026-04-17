import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

export const auth = betterAuth({
  baseURL: env.ORIGIN || 'http://localhost:5173',
  secret: env.BETTER_AUTH_SECRET || 'your-secret-key-change-this',
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { 
    enabled: true,
    // Add these options for better debugging
    async sendResetPassword(url, user) {
      console.log('Reset password URL:', url);
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'staff',
      },
      staffId: {
        type: 'string',
        required: false,
      },
      phone: {
        type: 'string',
        required: false,
      },
      department: {
        type: 'string',
        required: false,
      },
      isActive: {
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
    },
  },
  plugins: [
    sveltekitCookies(getRequestEvent)
  ],
  // Add logging for debugging
  logger: {
    level: 'debug',
  },
});