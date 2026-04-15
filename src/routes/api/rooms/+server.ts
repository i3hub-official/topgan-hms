import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { rooms } from '$lib/db/schema';

export async function GET() {
  const allRooms = await db.select().from(rooms);
  return json(allRooms);
}

export async function POST({ request }) {
  const data = await request.json();
  const newRoom = await db.insert(rooms).values(data).returning();
  return json(newRoom[0]);
}

export async function PATCH({ request, params }) {
  const { id, ...data } = await request.json();
  const updated = await db.update(rooms).set(data).where(eq(rooms.id, id)).returning();
  return json(updated[0]);
}