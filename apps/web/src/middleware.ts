/**
 * Middleware para proteger rutas y resolver tenant
 * MVP: resuelve tenant desde subdomain o header
 * TODO Fase 2: soporte multi-sucursal más profundo
 */
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();

  // Rutas públicas
  const publicPaths = ["/login", "/api/auth"];
  if (publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Requiere autenticación
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Inyectar accountId en headers para uso en server components/actions
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-account-id", session.user.accountId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
