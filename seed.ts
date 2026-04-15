import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
// Standard relative path import (don't use $lib)
import * as schema from './src/lib/server/db/schema.js';

// 1. Setup direct connection
const client = createClient({
  url: process.env.DATABASE_URL || 'file:./topgan.db',
});

// Use the consolidated schema object from your schema.ts
const db = drizzle(client, { schema: schema.schema });

// 2. Setup a local Auth instance just for seeding
// This avoids the $env / SvelteKit-specific imports
const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: schema.schema,
  }),
  emailAndPassword: { enabled: true },
});

async function seed() {
  console.log('🌱 Starting Database Seed...');

  try {
    // Clear existing data (Order matters for Foreign Keys)
    console.log('🧹 Cleaning database...');
    const tables = [
      'transactions', 'audit_logs', 'inventory_movements', 'inventory', 
      'power_logs', 'staff_activity', 'audit_trail', 'login_history', 
      'rooms', 'verification', 'session', 'account', 'user'
    ];

    for (const table of tables) {
      try {
        await db.run(`DELETE FROM ${table}`);
      } catch (e) {
        // Table might not exist yet, skip it
      }
    }

    await db.run(`DELETE FROM sqlite_sequence`);

    // Create 10 rooms
    console.log('🏨 Creating 10 rooms...');
    for (let i = 1; i <= 10; i++) {
      await db.insert(schema.rooms).values({
        roomNumber: String(i).padStart(3, '0'),
        status: 'vacant',
        rate: i <= 5 ? 15000 : 25000,
      });
    }

    // Create Admin User
    console.log('👤 Creating admin user...');
    await auth.api.signUpEmail({
      body: {
        email: 'admin@topgan.com',
        password: 'admin123',
        name: 'Admin User',
      },
    });

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();