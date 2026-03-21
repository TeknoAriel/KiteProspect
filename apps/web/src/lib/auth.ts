/**
 * Configuración de NextAuth (Auth.js v5)
 * MVP: credenciales simples (email/password)
 * TODO Fase 2: OAuth (Google, etc.) si se requiere
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@kite-prospect/db";
import bcrypt from "bcryptjs";
import { recordAuditEvent } from "@/lib/audit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        accountSlug: { label: "Cuenta (slug)", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const slug = String(credentials.accountSlug ?? "")
          .trim()
          .toLowerCase();
        if (!slug) {
          return null;
        }

        const account = await prisma.account.findUnique({
          where: { slug },
        });

        if (!account || account.status !== "active") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            accountId_email: {
              accountId: account.id,
              email: credentials.email as string,
            },
          },
          include: {
            account: true,
          },
        });

        if (!user || user.status !== "active") {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          accountId: user.accountId,
          accountSlug: user.account.slug,
        };
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (!user?.id) return;
      try {
        const full = await prisma.user.findUnique({
          where: { id: user.id },
          select: { accountId: true },
        });
        if (!full) return;
        await recordAuditEvent({
          accountId: full.accountId,
          entityType: "user",
          entityId: user.id,
          action: "session_started",
          actorId: user.id,
          actorType: "user",
          metadata: { provider: "credentials" },
        });
      } catch (e) {
        console.error("[audit] signIn event failed", e);
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accountId = user.accountId;
        token.role = user.role;
        token.accountSlug = user.accountSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.accountId = token.accountId as string;
        session.user.accountSlug = token.accountSlug as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
