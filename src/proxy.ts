import { NextRequest, NextResponse } from "next/server";
import { REFRESH_TOKEN_COOKIE_NAME } from "@/lib/cookies";

const protectedRoutes = ["/profile", "/settings", "/account", "/admin", "/wishlist"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const refreshTokenCookie = req.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(refreshTokenCookie);

  // Protection for Protected Routes: Redirect unauthenticated requests to /login
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/profile/:path*",
    "/settings/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/wishlist/:path*",
  ],
};
