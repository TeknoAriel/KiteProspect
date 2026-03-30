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
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const slug = String(credentials.accountSlug ?? "")
            .trim()
            .toLowerCase();
          if (!slug) {
            return null;
          }

          const emailNorm = String(credentials.email ?? "")
            .trim()
            .toLowerCase();
          if (!emailNorm) {
            return null;
          }

          const account = await prisma.account.findUnique({
            where: { slug },
          });

          if (!account || account.status !== "active") {
            if (process.env.NODE_ENV === "development") {
              console.warn("[auth] authorize: cuenta inexistente o inactiva", { slug });
            }
            return null;
          }

          // Case-insensitive: evita fallos si el email en BD no coincide en mayúsculas (p. ej. datos viejos).
          const user = await prisma.user.findFirst({
            where: {
              accountId: account.id,
              email: { equals: emailNorm, mode: "insensitive" },
            },
            include: {
              account: true,
            },
          });

          if (!user || user.status !== "active") {
            if (process.env.NODE_ENV === "development") {
              console.warn("[auth] authorize: usuario inexistente o inactivo", { slug, email: emailNorm });
            }
            return null;
          }

          const isValid = await bcrypt.compare(
            String(credentials.password ?? ""),
            user.password,
          );

          if (!isValid) {
            if (process.env.NODE_ENV === "development") {
              console.warn("[auth] authorize: contraseña incorrecta", { slug, email: emailNorm });
            }
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
        } catch (e) {
          console.error("[auth] authorize: error de base de datos o bcrypt", e);
          return null;
        }
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
