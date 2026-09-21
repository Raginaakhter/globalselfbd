import { NextResponse } from "next/server";

export const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

/**
 * Set HttpOnly Refresh Token cookie on Next.js Response
 */
export function setRefreshTokenCookie(response: NextResponse, refreshToken: string) {
  const isProduction = process.env.NODE_ENV === "production";
  
  // 7 days in seconds
  const maxAge = 7 * 24 * 60 * 60;

  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: refreshToken,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: maxAge,
  });

  return response;
}

/**
 * Clear Refresh Token cookie on Next.js Response
 */
export function clearRefreshTokenCookie(response: NextResponse) {
  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
