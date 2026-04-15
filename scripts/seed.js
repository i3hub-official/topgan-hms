import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { config } from 'dotenv';

config();

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./topgan.db',
});
const db = drizzle(client);

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data using raw SQL (order matters due to foreign keys)
  console.log('Clearing old data...');
  await db.run(`DELETE FROM transactions`);
  await db.run(`DELETE FROM audit_logs`);
  await db.run(`DELETE FROM inventory_movements`);
  await db.run(`DELETE FROM inventory`);
  await db.run(`DELETE FROM power_logs`);
  await db.run(`DELETE FROM staff_activity`);
  await db.run(`DELETE FROM audit_trail`);
  await db.run(`DELETE FROM login_history`);
  await db.run(`DELETE FROM rooms`);
  // Auth tables (singular names as per schema)
  await db.run(`DELETE FROM verification`);
  await db.run(`DELETE FROM session`);
  await db.run(`DELETE FROM account`);
  await db.run(`DELETE FROM user`);

  // Reset auto-increment counters (SQLite)
  await db.run(`DELETE FROM sqlite_sequence WHERE name IN ('rooms', 'transactions', 'audit_logs', 'inventory', 'inventory_movements', 'power_logs')`);

  // Create 10 rooms
  console.log('Creating rooms...');
  for (let i = 1; i <= 10; i++) {
    await db.run({
      sql: `INSERT INTO rooms (room_number, status, rate) VALUES (?, ?, ?)`,
      args: [String(i), 'vacant', i <= 5 ? 15000 : 25000],
    });
  }

  // Create admin user using Better‑Auth API (server must be running)
  console.log('Creating admin user via Better‑Auth API...');
  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:5173';
  const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@topgan.com',
      password: 'admin123',
      name: 'Admin User',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to create admin user:', errorText);
    console.log('Make sure the dev server is running (pnpm dev) before seeding.');
    process.exit(1);
  }

  const data = await res.json();
  console.log('Admin user created:', data.user?.email || 'admin@topgan.com');

  console.log('✅ Database seeded successfully!');
  console.log('🔐 Login: admin@topgan.com / admin123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});