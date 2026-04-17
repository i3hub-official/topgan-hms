import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { suppliers } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
    const allSuppliers = await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
    return json(allSuppliers);
}

export async function POST({ request }) {
    const data = await request.json();
    const newSupplier = await db.insert(suppliers).values({
        ...data,
        isActive: true
    }).returning();
    return json(newSupplier[0]);
}