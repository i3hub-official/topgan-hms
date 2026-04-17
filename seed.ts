import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq, sql } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema.js';
import fs from 'fs';

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./topgan.db',
});

const db = drizzle(client, { schema: schema.schema });

const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET || 'secret-for-seeding-only',
});

async function resetAndSeed() {
  console.log('🌱 Starting Database Reset and Seed...');

  try {
    // Drop the database file if it exists
    const dbPath = './topgan.db';
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('🗑️ Removed existing database file');
    }

    console.log('📦 Creating fresh database...');
    
    // Wait a moment for the database to be recreated
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 1. CREATE ROLES
    console.log('\n👥 Creating RBAC roles...');
    const roles = [
      { id: 'owner', roleName: 'owner', permissions: ['*'], level: 100 },
      { id: 'super_admin', roleName: 'super_admin', permissions: ['*'], level: 90 },
      { id: 'general_manager', roleName: 'general_manager', permissions: ['dashboard', 'reports', 'audit', 'rooms', 'staff', 'inventory', 'power_logs'], level: 80 },
      { id: 'front_desk_manager', roleName: 'front_desk_manager', permissions: ['dashboard', 'rooms', 'transactions', 'checkin_checkout', 'guests'], level: 70 },
      { id: 'store_keeper', roleName: 'store_keeper', permissions: ['dashboard', 'inventory', 'suppliers', 'bar_tender', 'kitchen'], level: 60 },
      { id: 'store_keeper_bar', roleName: 'store_keeper_bar', permissions: ['dashboard', 'inventory', 'bar'], level: 60 },
      { id: 'store_keeper_kitchen', roleName: 'store_keeper_kitchen', permissions: ['dashboard', 'inventory', 'kitchen'], level: 60 },
      { id: 'store_keeper_store', roleName: 'store_keeper_store', permissions: ['dashboard', 'inventory', 'store'], level: 60 },
      { id: 'cleaner', roleName: 'cleaner', permissions: ['dashboard', 'time_tracking', 'rooms', 'my_profile'], level: 50 },
      { id: 'staff', roleName: 'staff', permissions: ['dashboard', 'time_tracking', 'my_profile'], level: 40 },
    ];

    for (const role of roles) {
      try {
        await db.insert(schema.staffRoles).values(role);
        console.log(`  ✓ Created role: ${role.roleName}`);
      } catch (error: any) {
        if (error.message?.includes('no such table')) {
          console.log(`  ⚠️ Table not ready yet, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          await db.insert(schema.staffRoles).values(role);
          console.log(`  ✓ Created role: ${role.roleName}`);
        } else {
          throw error;
        }
      }
    }

    // 2. CREATE CATEGORIES
    console.log('\n📂 Creating categories...');
    
    const supplierCategories = [
      { type: 'supplier', name: 'Diesel / Fuel', icon: '⛽', sortOrder: 1 },
      { type: 'supplier', name: 'Beverages (Soft Drinks)', icon: '🥤', sortOrder: 2 },
      { type: 'supplier', name: 'Drinks (Alcoholic)', icon: '🍺', sortOrder: 3 },
      { type: 'supplier', name: 'Food Supplies', icon: '🍽️', sortOrder: 4 },
      { type: 'supplier', name: 'Linens & Bedding', icon: '🛏️', sortOrder: 5 },
      { type: 'supplier', name: 'Cleaning Supplies', icon: '🧹', sortOrder: 6 },
      { type: 'supplier', name: 'Maintenance & Repair', icon: '🔧', sortOrder: 7 },
      { type: 'supplier', name: 'Electronics & Appliances', icon: '📺', sortOrder: 8 },
      { type: 'supplier', name: 'Furniture', icon: '🪑', sortOrder: 9 },
      { type: 'supplier', name: 'Kitchen Equipment', icon: '🍳', sortOrder: 10 },
      { type: 'supplier', name: 'Bar Supplies', icon: '🍸', sortOrder: 11 },
      { type: 'supplier', name: 'Office Supplies', icon: '📎', sortOrder: 12 }
    ];

    const inventoryCategories = [
      { type: 'inventory', name: 'Linens', icon: '🔹', sortOrder: 1 },
      { type: 'inventory', name: 'Amenities', icon: '🧴', sortOrder: 2 },
      { type: 'inventory', name: 'Beverages', icon: '🥤', sortOrder: 3 },
      { type: 'inventory', name: 'Drinks (Alcoholic)', icon: '🍺', sortOrder: 4 },
      { type: 'inventory', name: 'Food Supplies', icon: '🍽️', sortOrder: 5 },
      { type: 'inventory', name: 'Cleaning Supplies', icon: '🧹', sortOrder: 6 },
      { type: 'inventory', name: 'Maintenance', icon: '🔧', sortOrder: 7 },
      { type: 'inventory', name: 'Electronics', icon: '📺', sortOrder: 8 },
      { type: 'inventory', name: 'Furniture', icon: '🪑', sortOrder: 9 },
      { type: 'inventory', name: 'Kitchen Equipment', icon: '🍳', sortOrder: 10 },
      { type: 'inventory', name: 'Bar Supplies', icon: '🍸', sortOrder: 11 },
      { type: 'inventory', name: 'Office Supplies', icon: '📎', sortOrder: 12 }
    ];

    for (const cat of supplierCategories) {
      await db.insert(schema.categories).values(cat);
      console.log(`  ✓ Created supplier category: ${cat.name}`);
    }
    
    for (const cat of inventoryCategories) {
      await db.insert(schema.categories).values(cat);
      console.log(`  ✓ Created inventory category: ${cat.name}`);
    }

    // 3. CREATE ROOMS
    console.log('\n🏨 Creating 10 rooms...');
    for (let i = 1; i <= 10; i++) {
      const rate = i <= 3 ? 15000 : i <= 6 ? 25000 : i <= 8 ? 35000 : 50000;
      await db.insert(schema.rooms).values({
        roomNumber: String(i).padStart(3, '0'),
        status: i <= 2 ? 'occupied' : 'vacant',
        rate: rate,
        isActive: true,
        createdAt: new Date()
      });
      console.log(`  ✓ Created Room ${String(i).padStart(3, '0')} (₦${rate.toLocaleString()})`);
    }

    // 4. CREATE USERS
    console.log('\n👤 Creating staff users via Better Auth...');
    const users = [
      { email: 'owner@topgan.com', password: 'owner123', name: 'System Owner', role: 'owner', staffId: 'OWN001', phone: '+2348012345678', department: 'Executive' },
      { email: 'admin@topgan.com', password: 'admin123', name: 'Super Admin', role: 'super_admin', staffId: 'ADM001', phone: '+2348012345679', department: 'Administration' },
      { email: 'manager@topgan.com', password: 'manager123', name: 'General Manager', role: 'general_manager', staffId: 'MGR001', phone: '+2348012345680', department: 'Management' },
      { email: 'frontdesk@topgan.com', password: 'front123', name: 'Front Desk Manager', role: 'front_desk_manager', staffId: 'FD001', phone: '+2348012345681', department: 'Front Office' },
      { email: 'store@topgan.com', password: 'store123', name: 'Store Keeper', role: 'store_keeper', staffId: 'STK001', phone: '+2348012345682', department: 'Store/Bar/Kitchen' },
      { email: 'cleaner@topgan.com', password: 'clean123', name: 'Cleaner', role: 'cleaner', staffId: 'CLN001', phone: '+2348012345683', department: 'Housekeeping' },
      { email: 'staff@topgan.com', password: 'staff123', name: 'Regular Staff', role: 'staff', staffId: 'STF001', phone: '+2348012345684', department: 'Operations' },
      { email: 'storebar@topgan.com', password: 'store123', name: 'Bar Manager', role: 'store_keeper_bar', staffId: 'BAR001', phone: '+2348012345685', department: 'Bar' },
      { email: 'storekitchen@topgan.com', password: 'store123', name: 'Kitchen Manager', role: 'store_keeper_kitchen', staffId: 'KIT001', phone: '+2348012345686', department: 'Kitchen' },
      { email: 'storeonly@topgan.com', password: 'store123', name: 'Store Manager', role: 'store_keeper_store', staffId: 'STR001', phone: '+2348012345687', department: 'Store' }
    ];

    for (const userData of users) {
      try {
        const result = await auth.api.signUpEmail({
          body: {
            email: userData.email,
            password: userData.password,
            name: userData.name,
          },
        });

        if (result && result.user) {
          await db.update(schema.user)
            .set({
              role: userData.role,
              staffId: userData.staffId,
              phone: userData.phone,
              department: userData.department,
              emailVerified: true,
              isActive: true,
            })
            .where(eq(schema.user.id, result.user.id));
          console.log(`  ✓ Created ${userData.role}: ${userData.name}`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to create ${userData.email}:`, error);
      }
    }

    // 5. CREATE SUPPLIERS
    console.log('\n🏭 Creating suppliers...');
    const suppliersData = [
      { name: 'TotalEnergies', contactPerson: 'Michael Okafor', phone: '+2348078901234', email: 'supply@total.com', category: 'Diesel / Fuel', address: 'Lagos', isActive: true },
      { name: 'Nigerian Breweries', contactPerson: 'Peter Okafor', phone: '+2348045678901', email: 'sales@nbplc.com', category: 'Drinks (Alcoholic)', address: 'Lagos', isActive: true },
      { name: 'Coca-Cola Nigeria', contactPerson: 'Mary Adebayo', phone: '+2348034567890', email: 'orders@cocacola.com.ng', category: 'Beverages (Soft Drinks)', address: 'Ikeja, Lagos', isActive: true },
      { name: 'Dangote Flour Mills', contactPerson: 'Ahmed Bello', phone: '+2348056789012', email: 'flour@dangote.com', category: 'Food Supplies', address: 'Apapa, Lagos', isActive: true },
      { name: 'Linen Services Ltd', contactPerson: 'Grace Eze', phone: '+2348067890123', email: 'linen@linenservices.com', category: 'Linens & Bedding', address: 'Victoria Island', isActive: true }
    ];

    for (const supplier of suppliersData) {
      await db.insert(schema.suppliers).values(supplier);
      console.log(`  ✓ Created supplier: ${supplier.name}`);
    }

    // 6. CREATE INVENTORY ITEMS
    console.log('\n📦 Creating inventory items...');
    const inventoryItems = [
      { itemName: 'Twin Sheets Set', category: 'Linens', unit: 'sets', costPrice: 5000, sellingPrice: 8000, openingStock: 50, closingStock: 45, date: new Date() },
      { itemName: 'Bath Towels', category: 'Linens', unit: 'pieces', costPrice: 2000, sellingPrice: 3500, openingStock: 100, closingStock: 85, date: new Date() },
      { itemName: 'Mini Shampoo', category: 'Amenities', unit: 'bottles', costPrice: 300, sellingPrice: 500, openingStock: 200, closingStock: 180, date: new Date() },
      { itemName: 'Coffee Pods', category: 'Beverages', unit: 'pods', costPrice: 150, sellingPrice: 300, openingStock: 500, closingStock: 420, date: new Date() },
      { itemName: 'Beer - Star', category: 'Drinks (Alcoholic)', unit: 'bottles', costPrice: 400, sellingPrice: 800, openingStock: 300, closingStock: 250, date: new Date() },
      { itemName: 'Whiskey - Johnnie Walker', category: 'Drinks (Alcoholic)', unit: 'bottles', costPrice: 15000, sellingPrice: 25000, openingStock: 50, closingStock: 45, date: new Date() },
      { itemName: 'Soft Drinks Assorted', category: 'Beverages', unit: 'crates', costPrice: 1200, sellingPrice: 2000, openingStock: 30, closingStock: 25, date: new Date() },
      { itemName: 'Rice - 50kg', category: 'Food Supplies', unit: 'bags', costPrice: 35000, sellingPrice: 45000, openingStock: 20, closingStock: 18, date: new Date() },
      { itemName: 'Cooking Oil', category: 'Food Supplies', unit: 'liters', costPrice: 800, sellingPrice: 1500, openingStock: 100, closingStock: 85, date: new Date() },
      { itemName: 'Tomatoes Canned', category: 'Food Supplies', unit: 'cans', costPrice: 400, sellingPrice: 700, openingStock: 200, closingStock: 175, date: new Date() }
    ];

    for (const item of inventoryItems) {
      await db.insert(schema.inventory).values(item);
      console.log(`  ✓ Created inventory: ${item.itemName}`);
    }

    // 7. STAFF DETAILS
    console.log('\n💼 Creating staff bank and personal details...');
    const cleanerUser = await db.select().from(schema.user).where(eq(schema.user.email, 'cleaner@topgan.com')).limit(1);
    const storeUser = await db.select().from(schema.user).where(eq(schema.user.email, 'store@topgan.com')).limit(1);
    const staffUser = await db.select().from(schema.user).where(eq(schema.user.email, 'staff@topgan.com')).limit(1);
    
    const staffDetailsData = [
      {
        userId: cleanerUser[0]?.id,
        address: '15 Cleaner Street, Lagos',
        nextOfKinName: 'John Doe',
        nextOfKinPhone: '+2348123456789',
        bankName: 'GTBank',
        accountNumber: '0123456789',
        accountName: 'Cleaner User',
        salary: 50000,
        dateJoined: new Date()
      },
      {
        userId: storeUser[0]?.id,
        address: '22 Store Road, Lagos',
        nextOfKinName: 'Jane Doe',
        nextOfKinPhone: '+2348234567890',
        bankName: 'First Bank',
        accountNumber: '9876543210',
        accountName: 'Store Keeper',
        salary: 75000,
        dateJoined: new Date()
      },
      {
        userId: staffUser[0]?.id,
        address: '45 Staff Avenue, Lagos',
        nextOfKinName: 'James Wilson',
        nextOfKinPhone: '+2348345678901',
        bankName: 'Access Bank',
        accountNumber: '5556667778',
        accountName: 'Regular Staff',
        salary: 45000,
        dateJoined: new Date()
      }
    ];

    for (const details of staffDetailsData) {
      if (details.userId) {
        await db.insert(schema.staffDetails).values({
          id: crypto.randomUUID(),
          ...details
        });
        console.log(`  ✓ Created staff details`);
      }
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('  ====================================');
    console.log('  👑 Owner:        owner@topgan.com / owner123');
    console.log('  🔐 Super Admin:  admin@topgan.com / admin123');
    console.log('  📊 Manager:      manager@topgan.com / manager123');
    console.log('  🏨 Front Desk:   frontdesk@topgan.com / front123');
    console.log('  🍺 Store (Full): store@topgan.com / store123');
    console.log('  🍺 Store (Bar):  storebar@topgan.com / store123');
    console.log('  🍳 Store (Kitchen): storekitchen@topgan.com / store123');
    console.log('  📦 Store (Store): storeonly@topgan.com / store123');
    console.log('  🧹 Cleaner:      cleaner@topgan.com / clean123');
    console.log('  👥 Staff:        staff@topgan.com / staff123');
    console.log('  ====================================');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

resetAndSeed();