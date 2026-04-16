import { json } from '@sveltejs/kit';
import { db, rooms, transactions, auditLogs, inventory, powerLogs } from '$lib/server/db';
import { eq, and, gte, lt, sql, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // 1. Get physical occupancy (from manual count - we'll use active check-ins)
  const physicalOccupancy = await db.select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, 'active'),
        gte(transactions.checkIn, today),
        lt(transactions.checkIn, tomorrow)
      )
    );
  
  // 2. Get system bookings
  const systemBookings = await db.select({ count: sql<number>`count(*)` })
    .from(rooms)
    .where(eq(rooms.status, 'occupied'));
  
  const physicalCount = Number(physicalOccupancy[0]?.count || 0);
  const systemCount = Number(systemBookings[0]?.count || 0);
  const discrepancy = physicalCount - systemCount;
  
  // 3. Generate flags
  const flags: string[] = [];
  if (discrepancy > 0) {
    flags.push(`RED FLAG: ${discrepancy} room(s) physically occupied but no payment recorded`);
  }
  if (discrepancy < 0) {
    flags.push(`WARNING: ${Math.abs(discrepancy)} room(s) have payments but no physical occupancy`);
  }
  
  // 4. Check fuel efficiency anomalies
  const recentPowerLogs = await db.select()
    .from(powerLogs)
    .orderBy(desc(powerLogs.createdAt))
    .limit(5);
  
  const avgEfficiency = recentPowerLogs.reduce((sum, log) => sum + (log.efficiency || 0), 0) / recentPowerLogs.length;
  const lastLog = recentPowerLogs[0];
  if (lastLog && lastLog.efficiency && lastLog.efficiency > avgEfficiency * 1.2) {
    flags.push(`RED FLAG: Unusual fuel consumption detected - ${lastLog.efficiency.toFixed(2)} L/hr (avg: ${avgEfficiency.toFixed(2)} L/hr)`);
  }
  
  // 5. Get financial summary
  const payments = await db.select({
    cash: sql<number>`sum(case when ${transactions.paymentMethod} = 'cash' then ${transactions.amount} else 0 end)`,
    pos: sql<number>`sum(case when ${transactions.paymentMethod} = 'pos' then ${transactions.amount} else 0 end)`,
    transfer: sql<number>`sum(case when ${transactions.paymentMethod} = 'transfer' then ${transactions.amount} else 0 end)`
  })
  .from(transactions)
  .where(
    and(
      gte(transactions.createdAt, today),
      lt(transactions.createdAt, tomorrow)
    )
  );
  
  // 6. Create audit log
  await db.insert(auditLogs).values({
    auditDate: today,
    physicalOccupancy: physicalCount,
    systemBookings: systemCount,
    discrepancy: discrepancy,
    flags: JSON.stringify(flags),
    totalCash: payments[0]?.cash || 0,
    totalPos: payments[0]?.pos || 0,
    totalTransfer: payments[0]?.transfer || 0,
    notes: `Night audit completed by ${locals.user?.name || 'system'}`
  });
  
  return json({ success: true, discrepancy, flags });
};