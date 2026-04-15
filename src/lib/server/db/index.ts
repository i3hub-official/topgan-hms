import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import * as authSchema from './auth-schema';
import { env } from '$env/dynamic/private';

// Validate environment variables
if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in environment variables');
}

// Initialize the libSQL client
const client = createClient({
    url: env.DATABASE_URL,
    // Using || undefined ensures it doesn't pass an empty string to Turso
    authToken: env.DATABASE_AUTH_TOKEN || undefined, 
});

// Export the drizzle instance with the schema attached for type-safe queries
export const db = drizzle(client, { schema: ...schema, ...authSchema });

/**
 * Helper to verify connection.
 * Useful for your "Audit" module to check sync status.
 */
export async function testConnection() {
    try {
        await client.execute('SELECT 1');
        console.log('✅ [TOPGAN-DB]: Connection verified');
        return true;
    } catch (error) {
        console.error('❌ [TOPGAN-DB]: Connection failed:', error);
        return false;
    }
}




