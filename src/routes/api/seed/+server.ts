import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { error, json } from '@sveltejs/kit';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';

const auth = betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite' }),
    emailAndPassword: { enabled: true },
    secret: env.BETTER_AUTH_SECRET || 'development-secret-123',
});

export const GET = async () => {
    // SECURITY: Prevent accidental execution in production
    if (process.env.NODE_ENV !== 'development') {
        throw error(403, 'Seeding is disabled in production.');
    }

    try {
        console.log('🏁 Starting Full TOPGAN HMS Database Seed...');

        // 1. CLEANUP (Order matters for Foreign Keys)
        console.log('🧹 Cleaning database...');
        await db.delete(schema.purchaseOrderItems);
        await db.delete(schema.purchaseOrders);
        await db.delete(schema.inventoryMovements);
        await db.delete(schema.inventory);
        await db.delete(schema.suppliers);
        await db.delete(schema.transactions);
        await db.delete(schema.auditLogs);
        await db.delete(schema.powerLogs);
        await db.delete(schema.staffActivity);
        await db.delete(schema.auditTrail);
        await db.delete(schema.loginHistory);
        await db.delete(schema.staffDetails);
        await db.delete(schema.rooms);
        await db.delete(schema.categories);
        await db.delete(schema.staffRoles);
        await db.delete(schema.session);
        await db.delete(schema.account);
        await db.delete(schema.user);
        console.log('✓ Database cleaned');

        // 2. CREATE ROLES (RBAC)
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
        await db.insert(schema.staffRoles).values(roles);
        console.log(`✓ Created ${roles.length} roles`);

        // 3. CREATE CATEGORIES
        console.log('\n📂 Creating categories...');
        const categories = [
            // Supplier Categories
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
            { type: 'supplier', name: 'Office Supplies', icon: '📎', sortOrder: 12 },
            // Inventory Categories
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
        await db.insert(schema.categories).values(categories);
        console.log(`✓ Created ${categories.length} categories`);

        // 4. CREATE ROOMS
        console.log('\n🏨 Creating rooms...');
        const rooms = [];
        for (let i = 1; i <= 10; i++) {
            const rate = i <= 3 ? 15000 : i <= 6 ? 25000 : i <= 8 ? 35000 : 50000;
            rooms.push({
                roomNumber: String(i).padStart(3, '0'),
                status: i <= 2 ? 'occupied' : 'vacant',
                rate: rate,
                isActive: true,
                createdAt: new Date()
            });
        }
        await db.insert(schema.rooms).values(rooms);
        console.log(`✓ Created ${rooms.length} rooms`);

        // 5. CREATE SUPPLIERS
        console.log('\n🏭 Creating suppliers...');
        const suppliersData = [
            { name: 'TotalEnergies', contactPerson: 'Michael Okafor', phone: '+2348078901234', email: 'supply@total.com', category: 'Diesel / Fuel', address: 'Lagos', isActive: true },
            { name: 'Nigerian Breweries', contactPerson: 'Peter Okafor', phone: '+2348045678901', email: 'sales@nbplc.com', category: 'Drinks (Alcoholic)', address: 'Lagos', isActive: true },
            { name: 'Coca-Cola Nigeria', contactPerson: 'Mary Adebayo', phone: '+2348034567890', email: 'orders@cocacola.com.ng', category: 'Beverages (Soft Drinks)', address: 'Ikeja, Lagos', isActive: true },
            { name: 'Dangote Flour Mills', contactPerson: 'Ahmed Bello', phone: '+2348056789012', email: 'flour@dangote.com', category: 'Food Supplies', address: 'Apapa, Lagos', isActive: true },
            { name: 'Linen Services Ltd', contactPerson: 'Grace Eze', phone: '+2348067890123', email: 'linen@linenservices.com', category: 'Linens & Bedding', address: 'Victoria Island', isActive: true }
        ];
        await db.insert(schema.suppliers).values(suppliersData);
        console.log(`✓ Created ${suppliersData.length} suppliers`);

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
        await db.insert(schema.inventory).values(inventoryItems);
        console.log(`✓ Created ${inventoryItems.length} inventory items`);

        // 7. CREATE POWER LOGS
        console.log('\n⚡ Creating power logs...');
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const powerLogs = [
            {
                generatorStart: new Date(today.setHours(8, 0, 0, 0)),
                generatorStop: new Date(today.setHours(12, 0, 0, 0)),
                fuelLevelStart: 100,
                fuelLevelEnd: 85,
                fuelConsumed: 15,
                hoursRun: 4,
                efficiency: 3.75,
                flagged: 0
            },
            {
                generatorStart: new Date(yesterday.setHours(18, 0, 0, 0)),
                generatorStop: new Date(yesterday.setHours(22, 0, 0, 0)),
                fuelLevelStart: 85,
                fuelLevelEnd: 65,
                fuelConsumed: 20,
                hoursRun: 4,
                efficiency: 5,
                flagged: 1
            }
        ];
        await db.insert(schema.powerLogs).values(powerLogs);
        console.log(`✓ Created ${powerLogs.length} power logs`);

        // 8. CREATE USERS & STAFF DETAILS
        console.log('\n👤 Creating users...');
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

        // 9. CREATE STAFF DETAILS (Bank Info)
        console.log('\n💼 Creating staff bank details...');
        const cleanerUser = await db.select().from(schema.user).where(eq(schema.user.email, 'cleaner@topgan.com')).limit(1);
        const storeUser = await db.select().from(schema.user).where(eq(schema.user.email, 'store@topgan.com')).limit(1);
        const staffUser = await db.select().from(schema.user).where(eq(schema.user.email, 'staff@topgan.com')).limit(1);
        
        const staffDetailsData = [];
        
        if (cleanerUser[0]) {
            staffDetailsData.push({
                id: crypto.randomUUID(),
                userId: cleanerUser[0].id,
                address: '15 Cleaner Street, Lagos',
                nextOfKinName: 'John Doe',
                nextOfKinPhone: '+2348123456789',
                bankName: 'GTBank',
                accountNumber: '0123456789',
                accountName: 'Cleaner User',
                salary: 50000,
                dateJoined: new Date()
            });
        }
        
        if (storeUser[0]) {
            staffDetailsData.push({
                id: crypto.randomUUID(),
                userId: storeUser[0].id,
                address: '22 Store Road, Lagos',
                nextOfKinName: 'Jane Doe',
                nextOfKinPhone: '+2348234567890',
                bankName: 'First Bank',
                accountNumber: '9876543210',
                accountName: 'Store Keeper',
                salary: 75000,
                dateJoined: new Date()
            });
        }
        
        if (staffUser[0]) {
            staffDetailsData.push({
                id: crypto.randomUUID(),
                userId: staffUser[0].id,
                address: '45 Staff Avenue, Lagos',
                nextOfKinName: 'James Wilson',
                nextOfKinPhone: '+2348345678901',
                bankName: 'Access Bank',
                accountNumber: '5556667778',
                accountName: 'Regular Staff',
                salary: 45000,
                dateJoined: new Date()
            });
        }

        for (const details of staffDetailsData) {
            await db.insert(schema.staffDetails).values(details);
        }
        console.log(`✓ Created ${staffDetailsData.length} staff bank details`);

        // 10. CREATE STAFF ACTIVITY (Time Tracking)
        console.log('\n⏰ Creating staff activity...');
        const todayMorning = new Date();
        todayMorning.setHours(8, 0, 0, 0);
        
        const yesterdayActivity = new Date();
        yesterdayActivity.setDate(yesterdayActivity.getDate() - 1);
        yesterdayActivity.setHours(9, 0, 0, 0);
        const yesterdayEvening = new Date(yesterdayActivity);
        yesterdayEvening.setHours(17, 0, 0, 0);

        const staffActivities = [];
        
        if (cleanerUser[0]) {
            staffActivities.push({
                id: crypto.randomUUID(),
                userId: cleanerUser[0].id,
                checkIn: todayMorning,
                checkOut: null,
                shiftType: 'morning',
                hoursWorked: null,
                location: 'Main Building',
                createdAt: new Date()
            });
        }
        
        if (storeUser[0]) {
            staffActivities.push({
                id: crypto.randomUUID(),
                userId: storeUser[0].id,
                checkIn: yesterdayActivity,
                checkOut: yesterdayEvening,
                shiftType: 'regular',
                hoursWorked: 8,
                location: 'Store/Bar',
                createdAt: yesterdayActivity
            });
        }

        for (const activity of staffActivities) {
            await db.insert(schema.staffActivity).values(activity);
        }
        console.log(`✓ Created ${staffActivities.length} staff activities`);

        // 11. CREATE AUDIT TRAIL ENTRIES
        console.log('\n📝 Creating audit trail entries...');
        const ownerUser = await db.select().from(schema.user).where(eq(schema.user.email, 'owner@topgan.com')).limit(1);
        
        if (ownerUser[0]) {
            const auditEntries = [
                {
                    id: crypto.randomUUID(),
                    userId: ownerUser[0].id,
                    action: 'SYSTEM_SEED',
                    entityType: 'system',
                    newValues: { seed: 'complete' },
                    createdAt: new Date()
                },
                {
                    id: crypto.randomUUID(),
                    userId: ownerUser[0].id,
                    action: 'DATABASE_INITIALIZED',
                    entityType: 'system',
                    newValues: { version: '1.0.0' },
                    createdAt: new Date()
                }
            ];
            await db.insert(schema.auditTrail).values(auditEntries);
            console.log(`✓ Created ${auditEntries.length} audit trail entries`);
        }

        // 12. CREATE SAMPLE TRANSACTIONS
        console.log('\n💰 Creating sample transactions...');
        const roomsList = await db.select().from(schema.rooms);
        const occupiedRoom = roomsList.find(r => r.status === 'occupied');
        
        if (occupiedRoom) {
            const transactions = [
                {
                    roomId: occupiedRoom.id,
                    guestName: 'John Smith',
                    amount: 25000,
                    paymentMethod: 'cash',
                    checkIn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    status: 'active',
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
                },
                {
                    roomId: roomsList[3]?.id,
                    guestName: 'Sarah Johnson',
                    amount: 35000,
                    paymentMethod: 'pos',
                    checkIn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    checkOut: new Date(),
                    status: 'completed',
                    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
                }
            ];
            await db.insert(schema.transactions).values(transactions);
            console.log(`✓ Created ${transactions.length} sample transactions`);
        }

        console.log('\n✅ TOPGAN HMS Database seeded successfully!');
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
        console.log('\n📊 Seed Summary:');
        console.log(`  - ${roles.length} roles created`);
        console.log(`  - ${categories.length} categories created`);
        console.log(`  - ${rooms.length} rooms created`);
        console.log(`  - ${suppliersData.length} suppliers created`);
        console.log(`  - ${inventoryItems.length} inventory items created`);
        console.log(`  - ${users.length} users created`);
        console.log(`  - ${staffDetailsData.length} staff bank details created`);
        console.log(`  - ${staffActivities.length} staff activities created`);
        console.log(`  - ${powerLogs.length} power logs created`);

        return json({ 
            success: true, 
            message: 'Complete TOPGAN HMS Database Seeded Successfully!',
            summary: {
                roles: roles.length,
                categories: categories.length,
                rooms: rooms.length,
                suppliers: suppliersData.length,
                inventory: inventoryItems.length,
                users: users.length,
                staffDetails: staffDetailsData.length,
                staffActivities: staffActivities.length,
                powerLogs: powerLogs.length
            }
        });

    } catch (err) {
        console.error('❌ Seed failed:', err);
        return json({ success: false, error: String(err) }, { status: 500 });
    }
};