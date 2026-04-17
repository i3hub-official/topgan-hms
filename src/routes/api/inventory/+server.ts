import { json } from '@sveltejs/kit';
import { db, inventory, inventoryMovements } from '$lib/server/db';
import { eq, and, gte, lt, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const items = await db.select().from(inventory).where(eq(inventory.date, today));
  
  // Calculate closing stock and variance
  const processed = items.map(item => ({
    ...item,
    closingStock: (item.openingStock ?? 0) + (item.additions ?? 0) - (item.sales ?? 0),
    variance: item.physicalCount ? (item.physicalCount - ((item.openingStock ?? 0) + (item.additions ?? 0) - (item.sales ?? 0))) : 0
  }));
  
  return json(processed);
};

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const newItem = await db.insert(inventory).values({
    ...data,
    date: today,
    openingStock: data.openingStock || 0,
    additions: 0,
    sales: 0,
    closingStock: data.openingStock || 0
  }).returning();
  
  return json(newItem[0]);
};