import { NextRequest, NextResponse } from "next/server";
import { REFRESH_TOKEN_COOKIE_NAME, setRefreshTokenCookie, clearRefreshTokenCookie } from "@/lib/cookies";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    // Read refresh token from HttpOnly cookie or request body fallback
    let refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (!refreshToken) {
      try {
        const body = await req.json();
        refreshToken = body.refreshToken;
      } catch {
        // No body provided
      }
    }

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "No active authentication session",
        },
        { status: 200 }
      );
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload || !payload.userId) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Invalid or expired refresh token",
        },
        { status: 200 }
      );
      return clearRefreshTokenCookie(response);
    }

    const tokenHash = hashToken(refreshToken);

    // Look up refresh session in DB
    const existingSession = await prisma.refreshSession.findUnique({
      where: { tokenHash },
    });

    if (!existingSession || existingSession.expiresAt < new Date()) {
      if (existingSession) {
        // Use deleteMany to avoid P2025 errors from race conditions
        await prisma.refreshSession.deleteMany({ where: { id: existingSession.id } });
      }
      const response = NextResponse.json(
        {
          success: false,
          message: "Session has expired or been revoked",
        },
        { status: 200 }
      );
      return clearRefreshTokenCookie(response);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      const response = NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 200 }
      );
      return clearRefreshTokenCookie(response);
    }

    // Refresh Token Rotation: Atomically delete old session using deleteMany
    // to gracefully handle race conditions (React StrictMode double-mount, etc.)
    const deleteResult = await prisma.refreshSession.deleteMany({
      where: { id: existingSession.id },
    });

    // If deleteMany affected 0 rows, another concurrent request already consumed this token
    if (deleteResult.count === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Session already refreshed by another request",
        },
        { status: 200 }
      );
    }

    const newAccessToken = signAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = signRefreshToken({ userId: user.id, email: user.email });
    const newRefreshTokenHash = hashToken(newRefreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: newRefreshTokenHash,
        userAgent: req.headers.get("user-agent") || "unknown",
        ipAddress: ip,
        expiresAt,
      },
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };

    const response = NextResponse.json(
      {
        success: true,
        message: "Token refreshed successfully",
        data: {
          user: safeUser,
          accessToken: newAccessToken,
        },
      },
      { status: 200 }
    );

    return setRefreshTokenCookie(response, newRefreshToken);
  } catch (error) {
    console.error("Refresh API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while refreshing authentication session",
      },
      { status: 500 }
    );
  }
}
