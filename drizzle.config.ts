// src/drizzle.config.ts

import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';   // This loads .env variables for drizzle-kit

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
   url: process.env.TURSO_DATABASE_URL, 
  },
  // Optional but recommended settings
  verbose: true,
  strict: true,
});