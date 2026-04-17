import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/server/db/schema.js';
import crypto from 'node:crypto';

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./topgan.db',
});

const db = drizzle(client, { schema });

const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
});

async function resetAndSeed() {
  console.log('🌱 Starting Database Reset and Seed...');

  try {
    // 1. CLEAN THE TABLES (In order of dependency)
    console.log('🧹 Clearing existing data...');
    await db.delete(schema.purchaseOrderItems);
    await db.delete(schema.purchaseOrders);
    await db.delete(schema.inventoryMovements);
    await db.delete(schema.inventory);
    await db.delete(schema.suppliers);
    await db.delete(schema.transactions);
    await db.delete(schema.rooms);
    await db.delete(schema.categories);
    await db.delete(schema.auditTrail);
    await db.delete(schema.auditLogs);
    await db.delete(schema.powerLogs);
    await db.delete(schema.staffActivity);
    await db.delete(schema.loginHistory);
    await db.delete(schema.staffDetails);
    await db.delete(schema.staffRoles);
    
    // Better Auth Core
    await db.delete(schema.session);
    await db.delete(schema.account);
    await db.delete(schema.verification);
    await db.delete(schema.user);
    console.log('✨ Database cleared');

    // 2. CREATE ROLES
    console.log('\n👥 Creating RBAC roles...');
    const roles = [
      { id: 'owner', roleName: 'owner', permissions: ['*'], level: 100 },
      { id: 'super_admin', roleName: 'super_admin', permissions: ['*'], level: 90 },
      { id: 'general_manager', roleName: 'general_manager', permissions: ['dashboard', 'reports', 'audit', 'rooms', 'staff', 'inventory', 'power_logs'], level: 80 },
      { id: 'front_desk_manager', roleName: 'front_desk_manager', permissions: ['dashboard', 'rooms', 'transactions', 'checkin_checkout', 'guests'], level: 70 },
      { id: 'store_keeper', roleName: 'store_keeper', permissions: ['dashboard', 'inventory', 'suppliers', 'bar_tender', 'kitchen'], level: 60 },
      { id: 'cleaner', roleName: 'cleaner', permissions: ['dashboard', 'time_tracking', 'rooms', 'my_profile'], level: 50 },
      { id: 'staff', roleName: 'staff', permissions: ['dashboard', 'time_tracking', 'my_profile'], level: 40 },
    ];
    await db.insert(schema.staffRoles).values(roles);

    // 3. CREATE CATEGORIES
    console.log('\n📂 Creating categories...');
    const categoryData = [
      { type: 'supplier', name: 'Diesel / Fuel', icon: '⛽', sortOrder: 1 },
      { type: 'supplier', name: 'Beverages', icon: '🥤', sortOrder: 2 },
      { type: 'inventory', name: 'Linens', icon: '🔹', sortOrder: 1 },
      { type: 'inventory', name: 'Food Supplies', icon: '🍽️', sortOrder: 2 },
    ];
    await db.insert(schema.categories).values(categoryData);

    // 4. CREATE ROOMS
    console.log('\n🏨 Creating 10 rooms...');
    const rooms = Array.from({ length: 10 }, (_, i) => ({
      roomNumber: String(i + 1).padStart(3, '0'),
      status: i < 2 ? 'occupied' : 'vacant',
      rate: (i + 1) <= 3 ? 15000 : (i + 1) <= 6 ? 25000 : 50000,
      isActive: true,
      createdAt: new Date(),
    }));
    await db.insert(schema.rooms).values(rooms);

    // 5. CREATE USERS & STAFF DETAILS
    console.log('\n👤 Creating staff users via Better Auth...');
    const usersToCreate = [
      { email: 'owner@topgan.com', password: 'owner123', name: 'System Owner', role: 'owner', staffId: 'OWN001', dept: 'Executive' },
      { email: 'admin@topgan.com', password: 'admin123', name: 'Super Admin', role: 'super_admin', staffId: 'ADM001', dept: 'Admin' },
      { email: 'cleaner@topgan.com', password: 'clean123', name: 'Housekeeper', role: 'cleaner', staffId: 'CLN001', dept: 'Housekeeping' },
    ];

    for (const u of usersToCreate) {
      const res = await auth.api.signUpEmail({
        body: { 
          email: u.email, 
          password: u.password, 
          name: u.name 
        },
      });

      if (res?.user) {
        // Update extended user fields
        await db.update(schema.user)
          .set({ 
            role: u.role, 
            staffId: u.staffId, 
            department: u.dept,
            emailVerified: true, 
            isActive: true 
          })
          .where(eq(schema.user.id, res.user.id));
        
        // Seed Staff Details
        await db.insert(schema.staffDetails).values({
          id: crypto.randomUUID(),
          userId: res.user.id,
          salary: u.role === 'cleaner' ? 50000 : 150000,
          bankName: 'GTBank',
          accountNumber: '0123456789',
          dateJoined: new Date()
        });
        
        console.log(`  ✓ Created ${u.role}: ${u.email}`);
      }
    }

    // 6. SEED INITIAL SUPPLIERS
    console.log('\n🏭 Seeding suppliers...');
    await db.insert(schema.suppliers).values([
        { name: 'TotalEnergies', phone: '+2348011122233', category: 'Diesel / Fuel' },
        { name: 'Coca-Cola', phone: '+2348022233344', category: 'Beverages' }
    ]);

    console.log('\n✅ Database reset and seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

resetAndSeed();