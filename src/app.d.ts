declare global {
  namespace App {
    interface Locals {
      user: import('better-auth').User | null;
      session: import('better-auth').Session | null;
      roles: string[]; // User roles for permission checks
    }
  }
}

export {};