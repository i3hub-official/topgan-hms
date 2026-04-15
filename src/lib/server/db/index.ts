import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as allSchema from './schema';

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./topgan.db',
});

// We pass the consolidated schema object here
export const db = drizzle(client, { schema: allSchema.schema });

// Re-export everything so you can do: import { user } from '$lib/server/db'
export * from './schema';