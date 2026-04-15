import { defineConfig, type Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
    schema: './src/lib/server/db/schema.ts',
    dialect: 'sqlite', // Keep as sqlite for standard libSQL/local use
    dbCredentials: { 
        url: process.env.DATABASE_URL,
        // If connecting to Turso, add: authToken: process.env.DATABASE_AUTH_TOKEN 
    },
    verbose: true,
    strict: true
}) satisfies Config;