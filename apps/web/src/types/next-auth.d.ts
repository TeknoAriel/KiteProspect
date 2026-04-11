import "next-auth";

declare module "next-auth" {
  interface User {
    accountId: string;
    role: string;
    accountSlug: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      accountId: string;
      accountSlug: string;
      /** Sucursal del registro `Advisor` vinculado al usuario (solo rol advisor). */
      advisorBranchId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accountId: string;
    role: string;
    accountSlug: string;
  }
}
