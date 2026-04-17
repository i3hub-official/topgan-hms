import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm'; // CRITICAL: Added this
import * as schema from '$lib/server/db/schema';

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./topgan.db',
});

const db = drizzle(client, { schema: schema.schema });

const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET || 'secret-for-seeding-only',
});

async function seed() {
  console.log('🌱 Starting TOPGAN HMS Database Seed...');

  try {
    // 1. CLEANING DATA
    console.log('🧹 Cleaning database...');
    const tables = [
      schema.transactions, schema.auditLogs, schema.inventoryMovements, 
      schema.inventory, schema.powerLogs, schema.staffActivity, 
      schema.auditTrail, schema.loginHistory, schema.staffDetails, 
      schema.suppliers, schema.rooms, schema.verification, 
      schema.session, schema.account, schema.user, schema.staffRoles
    ];

    for (const table of tables) {
      try {
        await db.delete(table);
        console.log(`  ✓ Cleared ${table}`);
      } catch (e) {
        console.log(`  ⚠️ Skipped a table (may not exist yet)`);
      }
    }

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

    for (const role of roles) {
      await db.insert(schema.staffRoles).values(role);
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
      });
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
     { email: 'storebar@topgan.com', password: 'store123', name: 'Bar Manager', role: 'store_keeper_bar', staffId: 'BAR001', phone: '+2348012345685', department: 'Bar' },
  { email: 'storekitchen@topgan.com', password: 'store123', name: 'Kitchen Manager', role: 'store_keeper_kitchen', staffId: 'KIT001', phone: '+2348012345686', department: 'Kitchen' },
  { email: 'storeonly@topgan.com', password: 'store123', name: 'Store Manager', role: 'store_keeper_store', staffId: 'STR001', phone: '+2348012345687', department: 'Store' },
    ];

    for (const userData of users) {
      // Better Auth SignUp
      const result = await auth.api.signUpEmail({
        body: {
          email: userData.email,
          password: userData.password,
          name: userData.name,
        },
      });

      if (result) {
        // Correct Drizzle Update syntax using eq()
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
    }

    // 5. SUPPLIERS
    console.log('\n🏭 Creating suppliers...');
    const suppliersData = [
      { name: 'TotalEnergies', contactPerson: 'Michael Okafor', phone: '+2348078901234', category: 'Diesel', address: 'Lagos' },
      { name: 'Nigerian Breweries', contactPerson: 'Peter Okafor', phone: '+2348045678901', category: 'Drinks', address: 'Lagos' },
    ];
    for (const s of suppliersData) await db.insert(schema.suppliers).values(s);

    // 6. STAFF DETAILS (Bank Info)
    console.log('\n💼 Creating bank/personal details...');
    const cleanerUser = await db.select().from(schema.user).where(eq(schema.user.email, 'cleaner@topgan.com')).limit(1);
    
    if (cleanerUser[0]) {
      await db.insert(schema.staffDetails).values({
        id: crypto.randomUUID(),
        userId: cleanerUser[0].id,
        address: '15 Cleaner Street, Lagos',
        bankName: 'GTBank',
        accountNumber: '0123456789',
        salary: 50000,
      });
    }

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();