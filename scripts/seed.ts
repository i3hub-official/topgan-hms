// scripts/seeds.ts

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
    // 1. CLEAN THE TABLES (In correct dependency order)
    console.log('🧹 Clearing existing data...');
    
    await db.delete(schema.purchaseOrderItems);
    await db.delete(schema.purchaseOrders);
    await db.delete(schema.inventoryMovements);
    await db.delete(schema.inventory);
    await db.delete(schema.inventoryCategories);   // New table
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
    await db.delete(schema.inventoryUnits);
    
    // Better Auth Core Tables
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
    console.log('  ✓ Roles seeded');

    // 3. CREATE INVENTORY CATEGORIES (New & Improved)
    console.log('\n📂 Creating Inventory Categories...');
    const inventoryCategoriesData = [
      { 
        name: 'Beverages', 
        description: 'Soft drinks, water, juices and alcoholic beverages', 
        icon: '🥤', 
        color: '#3b82f6', 
        sortOrder: 1 
      },
      { 
        name: 'Food Ingredients', 
        description: 'Rice, beans, spices, oils and cooking ingredients', 
        icon: '🍲', 
        color: '#ea580c', 
        sortOrder: 2 
      },
      { 
        name: 'Cleaning Supplies', 
        description: 'Detergents, disinfectants, brooms and mops', 
        icon: '🧼', 
        color: '#22c55e', 
        sortOrder: 3 
      },
      { 
        name: 'Linens & Towels', 
        description: 'Bed sheets, pillowcases, towels and bathrobes', 
        icon: '🛏️', 
        color: '#8b5cf6', 
        sortOrder: 4 
      },
      { 
        name: 'Toiletries', 
        description: 'Soap, shampoo, toilet paper and bathroom essentials', 
        icon: '🧴', 
        color: '#ec4899', 
        sortOrder: 5 
      },
      { 
        name: 'Stationery', 
        description: 'Pens, paper, printer ink and office supplies', 
        icon: '📝', 
        color: '#64748b', 
        sortOrder: 6 
      },
      { 
        name: 'Maintenance & Tools', 
        description: 'Electrical parts, plumbing tools and repair items', 
        icon: '🔧', 
        color: '#f59e0b', 
        sortOrder: 7 
      },
      { 
        name: 'Fuel & Lubricants', 
        description: 'Diesel, petrol and generator oils', 
        icon: '⛽', 
        color: '#ef4444', 
        sortOrder: 8 
      },
    ];

    await db.insert(schema.inventoryCategories).values(inventoryCategoriesData);
    console.log('  ✓ Inventory categories seeded');

    // 4. CREATE INVENTORY UNITS
    console.log('\n📦 Seeding inventory units...');
    await db.insert(schema.inventoryUnits).values([
      { name: 'Carton',      abbreviation: 'ctn',  sortOrder: 1 },
      { name: 'Bottle',      abbreviation: 'btl',  sortOrder: 2 },
      { name: 'Crate',       abbreviation: 'crt',  sortOrder: 3 },
      { name: 'Bag',         abbreviation: 'bag',  sortOrder: 4 },
      { name: 'Litre',       abbreviation: 'L',    sortOrder: 5 },
      { name: 'Kilogram',    abbreviation: 'kg',   sortOrder: 6 },
      { name: 'Gram',        abbreviation: 'g',    sortOrder: 7 },
      { name: 'Piece',       abbreviation: 'pcs',  sortOrder: 8 },
      { name: 'Dozen',       abbreviation: 'doz',  sortOrder: 9 },
      { name: 'Pack',        abbreviation: 'pk',   sortOrder: 10 },
      { name: 'Roll',        abbreviation: 'roll', sortOrder: 11 },
      { name: 'Box',         abbreviation: 'box',  sortOrder: 12 },
      { name: 'Gallon',      abbreviation: 'gal',  sortOrder: 13 },
      { name: 'Drum',        abbreviation: 'drm',  sortOrder: 14 },
      { name: 'Jerrycan',    abbreviation: 'jrn',  sortOrder: 15 },
    ]);
    console.log('  ✓ Inventory units seeded');

    // 5. CREATE ROOMS
    console.log('\n🏨 Creating 10 rooms...');
    const rooms = Array.from({ length: 10 }, (_, i) => ({
      roomNumber: String(i + 1).padStart(3, '0'),
      status: i < 3 ? 'occupied' : 'vacant',
      rate: i < 3 ? 25000 : i < 6 ? 35000 : 45000,
      isActive: true,
      createdAt: new Date(),
    }));
    await db.insert(schema.rooms).values(rooms);
    console.log('  ✓ Rooms seeded');

    // 6. CREATE USERS & STAFF DETAILS
    console.log('\n👤 Creating staff users via Better Auth...');
    const usersToCreate = [
      { email: 'owner@topgan.com',     password: 'owner123', name: 'System Owner',       role: 'owner',          staffId: 'OWN001', dept: 'Executive' },
      { email: 'admin@topgan.com',     password: 'admin123', name: 'Super Admin',        role: 'super_admin',    staffId: 'ADM001', dept: 'Administration' },
      { email: 'manager@topgan.com',   password: 'mgr123',   name: 'General Manager',    role: 'general_manager',staffId: 'MGR001', dept: 'Management' },
      { email: 'cleaner@topgan.com',   password: 'clean123', name: 'Housekeeper',        role: 'cleaner',        staffId: 'CLN001', dept: 'Housekeeping' },
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
        await db.update(schema.user)
          .set({ 
            role: u.role, 
            staffId: u.staffId, 
            department: u.dept,
            emailVerified: true, 
            isActive: true 
          })
          .where(eq(schema.user.id, res.user.id));
        
        await db.insert(schema.staffDetails).values({
          id: crypto.randomUUID(),
          userId: res.user.id,
          salary: u.role === 'cleaner' ? 65000 : u.role === 'owner' ? 250000 : 150000,
          bankName: 'GTBank',
          accountNumber: '0123456789',
          accountName: u.name,
          dateJoined: new Date()
        });
        
        console.log(`  ✓ Created ${u.role}: ${u.email}`);
      }
    }

    // 7. SEED SUPPLIERS
    console.log('\n🏭 Seeding suppliers...');
    await db.insert(schema.suppliers).values([
      { 
        name: 'TotalEnergies Nigeria', 
        contactPerson: 'Mr. Adebayo', 
        phone: '+2348011122233', 
        email: 'sales@totalng.com', 
        category: 'Fuel & Lubricants', 
        address: 'Port Harcourt' 
      },
      { 
        name: 'Coca-Cola Bottling Company', 
        contactPerson: 'Mrs. Chidinma', 
        phone: '+2348022233344', 
        email: 'distributor@cocacola.com', 
        category: 'Beverages', 
        address: 'Port Harcourt' 
      },
      { 
        name: 'Julius Berger Supplies', 
        contactPerson: 'Engr. Okon', 
        phone: '+2348033344455', 
        email: 'supplies@jb.com', 
        category: 'Cleaning Supplies', 
        address: 'Port Harcourt' 
      },
    ]);
    console.log('  ✓ Suppliers seeded');

    console.log('\n🎉 Database reset and seeded successfully!');
    console.log('   You can now login with:');
    console.log('   • owner@topgan.com     / owner123');
    console.log('   • admin@topgan.com     / admin123');
    console.log('   • manager@topgan.com   / mgr123');
    console.log('   • cleaner@topgan.com   / clean123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

resetAndSeed();