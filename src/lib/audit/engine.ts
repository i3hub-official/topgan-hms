import { db } from '$lib/server/db/index';
import { rooms, transactions, auditLogs } from '$lib/server/db/schema';
import { eq, gte } from 'drizzle-orm';

export interface AuditResult {
  systemCount: number;
  physicalCount: number;
  discrepancy: number;
  flaggedRooms: string[];
  totalRevenue: number;
  unrecordedEstimate: number;
}

export async function runNightAudit(
  physicalOccupied: string[],
  auditedBy: string,
  auditDate: Date = new Date()
): Promise<AuditResult> {
  // 1. Get system occupied rooms
  const occupiedInSystem = await db
    .select()
    .from(rooms)
    .where(eq(rooms.status, 'occupied'));

  const systemRoomNumbers = occupiedInSystem.map(r => r.roomNumber);

  // 2. Find discrepancies
  const flaggedRooms = physicalOccupied.filter(
    room => !systemRoomNumbers.includes(room)
  );

  const discrepancy = physicalOccupied.length - systemRoomNumbers.length;

  // 3. Calculate estimated revenue loss
  const avgRate = occupiedInSystem.reduce(
    (sum, r) => sum + Number(r.ratePerNight), 0
  ) / (occupiedInSystem.length || 1);

  const unrecordedEstimate = flaggedRooms.length * avgRate;

  // 4. Get today's revenue
  const startOfDay = new Date(auditDate);
  startOfDay.setHours(0, 0, 0, 0);

  const todayTxns = await db
    .select()
    .from(transactions)
    .where(gte(transactions.createdAt, startOfDay));

  const totalRevenue = todayTxns.reduce(
    (sum, t) => sum + Number(t.amountPaid), 0
  );

  // 5. Save audit log
  await db.insert(auditLogs).values({
    auditDate,
    physicalCount: physicalOccupied.length,
    systemCount: systemRoomNumbers.length,
    discrepancy,
    flagged: flaggedRooms,
    auditedBy,
  });

  return {
    systemCount: systemRoomNumbers.length,
    physicalCount: physicalOccupied.length,
    discrepancy,
    flaggedRooms,
    totalRevenue,
    unrecordedEstimate,
  };
}