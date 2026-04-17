// src/lib/server/db/index.ts

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as allSchema from './schema';
import { env } from '$env/dynamic/private';

const client = createClient({
  // Use Turso in production, fallback to local SQLite for development
  url: env.TURSO_DATABASE_URL, // || 'file:./topgan.db',
  authToken: env.TURSO_AUTH_TOKEN,
});

// Pass the consolidated schema object (which includes all tables + relations)
export const db = drizzle(client, { 
  schema: allSchema.schema 
});

// Re-export everything from the schema for convenient importing
export * from './schema';

// Optional: Export the client if needed elsewhere
export { client };