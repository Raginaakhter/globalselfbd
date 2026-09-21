import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { googleAuthSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { setRefreshTokenCookie } from "@/lib/cookies";
import { hashToken } from "@/lib/security";

const googleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "1058202288804-mpuaqjev1h8hh80edggke86iq28n184o.apps.googleusercontent.com";

const client = new OAuth2Client(googleClientId);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = googleAuthSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Google token is required",
        },
        { status: 400 }
      );
    }

    const { idToken } = parseResult.data;

    let email: string = "";
    let name: string = "";
    let avatar: string | null = null;
    let providerId: string = "";
    let emailVerified: boolean = false;

    // Check if token is a 3-part JWT (id_token) or a Google OAuth access_token (e.g. ya29...)
    const tokenSegments = idToken.split(".");

    if (tokenSegments.length === 3) {
      // 1. Verify as OIDC ID Token
      const ticket = await client.verifyIdToken({
        idToken,
        audience: googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to verify Google identity or email missing",
          },
          { status: 401 }
        );
      }

      email = payload.email.toLowerCase();
      name = payload.name || payload.given_name || "Google User";
      avatar = payload.picture || null;
      providerId = payload.sub;
      emailVerified = Boolean(payload.email_verified);
    } else {
      // 2. Verify as OAuth Access Token via Google userinfo endpoint
      const googleUserInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!googleUserInfoRes.ok) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to verify Google access token with Google server",
          },
          { status: 401 }
        );
      }

      const userInfo = await googleUserInfoRes.json();
      if (!userInfo || !userInfo.email) {
        return NextResponse.json(
          {
            success: false,
            message: "Google profile email missing",
          },
          { status: 401 }
        );
      }

      email = userInfo.email.toLowerCase();
      name = userInfo.name || userInfo.given_name || "Google User";
      avatar = userInfo.picture || null;
      providerId = userInfo.sub;
      emailVerified = Boolean(userInfo.email_verified);
    }

    if (!emailVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "Google account email is not verified",
        },
        { status: 401 }
      );
    }

    // Find or Create User in Database
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          avatar,
          provider: "google",
          providerId,
          emailVerified: true,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          avatar: avatar || user.avatar,
          providerId: providerId || user.providerId,
          emailVerified: true,
        },
      });
    }

    // Generate Access & Refresh Tokens
    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });
    const refreshTokenHash = hashToken(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
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
        message: "Google authentication successful!",
        data: {
          user: safeUser,
          accessToken,
        },
      },
      { status: 200 }
    );

    return setRefreshTokenCookie(response, refreshToken);
  } catch (error) {
    console.error("Google Auth API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Google authentication failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
