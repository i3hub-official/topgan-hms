// src/lib/server/db/index.ts

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as allSchema from './schema';
import { env } from '$env/dynamic/private';

const client = createClient({
  url: env.DATABASE_URL || 'file:./topgan.db',
});

// We pass the consolidated schema object here for relations and Better Auth
export const db = drizzle(client, { schema: allSchema.schema });

// Re-export individual tables for easier importing elsewhere
export * from './schema';