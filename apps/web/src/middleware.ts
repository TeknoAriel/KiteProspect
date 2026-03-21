/**
 * Protección del dashboard con el patrón oficial de Auth.js v5:
 * `auth()` resuelve la sesión igual que el resto de la app (no depender solo de getToken en Edge).
 */
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
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
  matcher: ["/dashboard/:path*"],
};
