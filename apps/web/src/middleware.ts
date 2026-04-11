/**
 * Protección del dashboard con el patrón oficial de Auth.js v5:
 * `auth()` resuelve la sesión igual que el resto de la app (no depender solo de getToken en Edge).
 * POST `/api/auth/*`: límite suave por IP (L23 alta producción).
 */
import { auth } from "@/lib/auth";
import { getClientIpFromRequest } from "@/lib/client-ip";
import { allowRateLimitWithConfig, getAuthRateLimitConfig } from "@/lib/rate-limit-memory";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith("/api/auth")) {
    if (req.method === "POST") {
      const ip = getClientIpFromRequest(req as NextRequest);
      const cfg = getAuthRateLimitConfig();
      if (!allowRateLimitWithConfig(`auth-post:${ip}`, cfg)) {
        return NextResponse.json(
          { error: "Demasiadas solicitudes. Intenta más tarde." },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil(cfg.windowMs / 1000)),
            },
          },
        );
      }
    }
    return NextResponse.next();
  }

  const user = req.auth?.user;
  if (!user?.accountId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-account-id", user.accountId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/auth/:path*"],
};
