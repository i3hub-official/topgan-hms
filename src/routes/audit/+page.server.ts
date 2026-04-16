import { z } from 'zod';
import { runNightAudit } from '$lib/audit/engine';
import { fail } from '@sveltejs/kit';

const auditSchema = z.object({
  physicalRooms: z.string().min(1, 'Enter at least one room number'),
  auditedBy: z.string().min(2, 'Name must be at least 2 characters'),
  notes: z.string().optional(),
});

export const actions = {
  default: async ({ request }) => {
    // Get form data
    const formData = await request.formData();
    const physicalRoomsRaw = formData.get('physicalRooms') as string;
    const auditedBy = formData.get('auditedBy') as string;
    const notes = formData.get('notes') as string;
    
    // Validate manually
    const validationResult = auditSchema.safeParse({
      physicalRooms: physicalRoomsRaw,
      auditedBy,
      notes
    });
    
    if (!validationResult.success) {
      // Return validation errors
      const errors = validationResult.error.flatten().fieldErrors;
      return fail(400, {
        success: false,
        errors,
        data: { physicalRooms: physicalRoomsRaw, auditedBy, notes }
      });
    }
    
    // Process the audit
    try {
      const rooms = physicalRoomsRaw
        .split(',')
        .map(r => r.trim().toUpperCase())
        .filter(r => r.length > 0);
      
      if (rooms.length === 0) {
        return fail(400, {
          success: false,
          errors: { physicalRooms: ['No valid room numbers entered'] },
          data: { physicalRooms: physicalRoomsRaw, auditedBy, notes }
        });
      }
      
      const result = await runNightAudit(rooms, auditedBy);
      
      return {
        success: true,
        result,
        data: { physicalRooms: physicalRoomsRaw, auditedBy, notes }
      };
    } catch (error) {
      console.error('Audit failed:', error);
      return fail(500, {
        success: false,
        error: 'Failed to run audit. Please try again.',
        data: { physicalRooms: physicalRoomsRaw, auditedBy, notes }
      });
    }
  }
};