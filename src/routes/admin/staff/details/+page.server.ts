import type { PageServerLoad, Actions } from './$types';
import { db, staffDetails, user } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  if (!session?.user) throw redirect(302, '/login');
  
  const details = await db.query.staffDetails.findFirst({
    where: eq(staffDetails.userId, session.user.id)
  });
  
  return { details, user: session.user };
};

export const actions: Actions = {
  updateDetails: async ({ request, locals }) => {
    const session = await locals.auth();
    if (!session?.user) throw error(401, 'Unauthorized');
    
    const formData = await request.formData();
    
    const details = {
      address: formData.get('address') as string,
      nextOfKinName: formData.get('nextOfKinName') as string,
      nextOfKinPhone: formData.get('nextOfKinPhone') as string,
      bankName: formData.get('bankName') as string,
      accountNumber: formData.get('accountNumber') as string,
      accountName: formData.get('accountName') as string,
      salary: parseFloat(formData.get('salary') as string),
      dateJoined: new Date(formData.get('dateJoined') as string)
    };
    
    const existing = await db.select().from(staffDetails).where(eq(staffDetails.userId, session.user.id)).limit(1);
    
    if (existing.length > 0) {
      await db.update(staffDetails).set(details).where(eq(staffDetails.userId, session.user.id));
    } else {
      await db.insert(staffDetails).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        ...details
      });
    }
    
    return { success: true };
  }
};