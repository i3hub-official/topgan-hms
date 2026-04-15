import { json } from '@sveltejs/kit';
import { db, rooms } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const allRooms = await db.select().from(rooms);
  return json(allRooms);
};

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const newRoom = await db.insert(rooms).values(data).returning();
  return json(newRoom[0]);
};