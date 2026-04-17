import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { inventoryMovements, inventory } from '$lib/server/db/schema';
import { eq, sql,desc } from 'drizzle-orm';

export async function GET() {
    const logs = await db.select().from(inventoryMovements).orderBy(desc(inventoryMovements.createdAt)).limit(100);
    return json(logs);
}

export async function POST({ request }) {
    const { itemId, type, quantity, reason } = await request.json();

    // 1. Record the Movement
    const movement = await db.insert(inventoryMovements).values({
        itemId,
        type,
        quantity,
        reason
    }).returning();

    // 2. Update Master Inventory (DBAdmin Logic)
    const adjustment = type === 'in' ? quantity : -quantity;
    await db.update(inventory)
        .set({
            closingStock: sql`${inventory.closingStock} + ${adjustment}`
        })
        .where(eq(inventory.id, itemId));

    return json(movement[0]);
}