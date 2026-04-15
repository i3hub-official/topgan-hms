import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { rooms, transactions, auditLogs, inventoryItems, powerLogs } from '$lib/db/schema';
import { eq, gte, and, desc, sql } from 'drizzle-orm';

export async function GET({ url }) {
  const period = url.searchParams.get('period') || 'today';
  
  // Get current date ranges
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // 1. Room stats
  const allRooms = await db.select().from(rooms);
  const totalRooms = allRooms.length;
  const occupiedRooms = allRooms.filter(r => r.status === 'occupied').length;
  const vacantRooms = allRooms.filter(r => r.status === 'vacant').length;
  const dirtyRooms = allRooms.filter(r => r.status === 'dirty').length;
  const maintenanceRooms = allRooms.filter(r => r.status === 'maintenance').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  
  // 2. Revenue stats
  let todayRevenue = 0;
  let weekRevenue = 0;
  let monthRevenue = 0;
  
  const allTransactions = await db.select().from(transactions);
  
  todayRevenue = allTransactions
    .filter(t => new Date(t.createdAt) >= today)
    .reduce((sum, t) => sum + Number(t.amountPaid), 0);
    
  weekRevenue = allTransactions
    .filter(t => new Date(t.createdAt) >= weekStart)
    .reduce((sum, t) => sum + Number(t.amountPaid), 0);
    
  monthRevenue = allTransactions
    .filter(t => new Date(t.createdAt) >= monthStart)
    .reduce((sum, t) => sum + Number(t.amountPaid), 0);
  
  // 3. Audit stats
  const todayAudits = await db
    .select()
    .from(auditLogs)
    .where(gte(auditLogs.auditDate, today));
  
  const pendingAudits = todayAudits.length === 0 ? 1 : 0;
  
  // 4. Inventory stats
  const inventory = await db.select().from(inventoryItems);
  const lowStockItems = inventory.filter(i => Number(i.currentStock) <= Number(i.reorderLevel)).length;
  
  // 5. Active generator
  const activeGen = await db
    .select()
    .from(powerLogs)
    .where(sql`${powerLogs.stopTime} IS NULL`)
    .limit(1);
  
  const activeGenerator = activeGen[0] || null;
  
  // 6. Recent transactions (last 5)
  const recentTransactions = await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.createdAt))
    .limit(5);
  
  // Enrich with room numbers
  const recentTransactionsWithRooms = await Promise.all(
    recentTransactions.map(async (t) => {
      const room = await db.select().from(rooms).where(eq(rooms.id, t.roomId)).limit(1);
      return {
        ...t,
        roomNumber: room[0]?.roomNumber || 'N/A'
      };
    })
  );
  
  // 7. Recent audits
  const recentAudits = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(5);
  
  // 8. Recent inventory activity
  const recentInventory = await db
    .select()
    .from(inventoryItems)
    .orderBy(desc(inventoryItems.updatedAt))
    .limit(10);
  
  return json({
    totalRooms,
    occupiedRooms,
    vacantRooms,
    dirtyRooms,
    maintenanceRooms,
    occupancyRate,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    pendingAudits,
    lowStockItems,
    activeGenerator,
    recentTransactions: recentTransactionsWithRooms,
    recentAudits,
    recentInventoryActivity: recentInventory
  });
}