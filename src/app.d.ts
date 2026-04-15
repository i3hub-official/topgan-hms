declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
      } | null;
      session: {
        id: string;
        userId: string;
        expiresAt: Date;
      } | null;
    }
  }
}

export {};