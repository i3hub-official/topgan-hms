import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db, rooms, transactions, auditLogs } from '$lib/server/db';
import { eq, and, gte, lt, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get room statistics
    const allRooms = await db.select().from(rooms);
    const totalRooms = allRooms.length;
    const occupiedRooms = allRooms.filter(r => r.status === 'occupied').length;
    const vacantRooms = allRooms.filter(r => r.status === 'vacant').length;
    const maintenanceRooms = allRooms.filter(r => r.status === 'maintenance').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    
    // Get today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayTransactions = await db.select()
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, today),
          lt(transactions.createdAt, tomorrow)
        )
      );
    
    const totalRevenue = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Get recent audit logs with flags
    const recentAudits = await db.select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);
    
    // Parse flags from JSON string
    const flags: any[] = [];
    for (const audit of recentAudits) {
      if (audit.flags) {
        let flagMessages: string[] = [];
        try {
          // Check if flags is already parsed or is a string
          if (typeof audit.flags === 'string') {
            flagMessages = JSON.parse(audit.flags);
          } else if (Array.isArray(audit.flags)) {
            flagMessages = audit.flags;
          }
        } catch (e) {
          // If parsing fails, treat as string
          flagMessages = [audit.flags];
        }
        
        for (const message of flagMessages) {
          flags.push({
            type: message.includes('RED FLAG') ? 'Critical Issue' : 'Warning',
            message: message,
            timestamp: audit.createdAt
          });
        }
      }
    }
    
    const activeFlags = flags.length;
    
    const stats = {
      occupancyRate,
      totalRevenue,
      activeFlags,
      pendingAudit: recentAudits.length === 0 || recentAudits[0]?.auditDate !== today,
      totalRooms,
      occupiedRooms,
      vacantRooms,
      maintenanceRooms
    };
    
    return json({ stats, flags: flags.slice(0, 5) }); // Return last 5 flags
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
};