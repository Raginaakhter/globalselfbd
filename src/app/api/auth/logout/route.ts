import { NextRequest, NextResponse } from "next/server";
import { REFRESH_TOKEN_COOKIE_NAME, clearRefreshTokenCookie } from "@/lib/cookies";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      // Revoke session in database
      await prisma.refreshSession.deleteMany({
        where: { tokenHash },
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Logout successful",
      },
      { status: 200 }
    );

    return clearRefreshTokenCookie(response);
  } catch (error) {
    console.error("Logout API error:", error);
    const response = NextResponse.json(
      {
        success: true,
        message: "Logout completed",
      },
      { status: 200 }
    );
    return clearRefreshTokenCookie(response);
  }
}
