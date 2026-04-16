// src/app.d.ts

declare global {
  namespace App {
    interface Locals {
      // Use the actual session type from your auth library
      // If Better Auth, you can often import the type, 
      // otherwise define it to match the error's source:
      session: {
        id: string;
        userId: string;
        expiresAt: Date;
        token: string;
        createdAt: Date;
        updatedAt: Date;
        ipAddress?: string | null;
        userAgent?: string | null;
      } | null | undefined; // Accept both null and undefined to satisfy the linter
      user: any; // Or your specific User type
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};