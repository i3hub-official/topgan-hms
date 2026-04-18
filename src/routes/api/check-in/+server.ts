import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { rooms, transactions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST({ request }) {
  const { roomId, guestName, amountPaid, paymentMethod, createdBy } = await request.json();
  
  // Create transaction
  const transaction = await db.insert(transactions).values({
    roomId,
    guestName,
    amountPaid,
    paymentMethod,
    checkIn: new Date(),
    createdBy
  }).returning();
  
  // Update room status
  await db.update(rooms).set({ status: 'occupied' }).where(eq(rooms.id, roomId));
  
  return json({ success: true, transaction: transaction[0] });
}