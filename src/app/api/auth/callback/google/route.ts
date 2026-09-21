import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { setRefreshTokenCookie } from "@/lib/cookies";
import { hashToken } from "@/lib/security";

const googleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "1058202288804-mpuaqjev1h8hh80edggke86iq28n184o.apps.googleusercontent.com";

const client = new OAuth2Client(googleClientId);

async function verifyGoogleToken(token: string) {
  const segments = token.split(".");
  if (segments.length === 3) {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return null;
    return {
      email: payload.email.toLowerCase(),
      name: payload.name || payload.given_name || "Google User",
      avatar: payload.picture || null,
      providerId: payload.sub,
    };
  } else {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const info = await res.json();
    if (!info || !info.email) return null;
    return {
      email: info.email.toLowerCase(),
      name: info.name || info.given_name || "Google User",
      avatar: info.picture || null,
      providerId: info.sub,
    };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("id_token") || searchParams.get("credential") || searchParams.get("access_token");

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const googleUser = await verifyGoogleToken(token);
    if (!googleUser) {
      return NextResponse.redirect(new URL("/login?error=google_failed", req.url));
    }

    let user = await prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          avatar: googleUser.avatar,
          provider: "google",
          providerId: googleUser.providerId,
          emailVerified: true,
        },
      });
    }

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

    const response = NextResponse.redirect(new URL("/", req.url));
    return setRefreshTokenCookie(response, refreshToken);
  } catch (error) {
    console.error("Google Callback GET error:", error);
    return NextResponse.redirect(new URL("/login?error=google_failed", req.url));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.idToken || body.credential || body.access_token;

    if (!token) {
      return NextResponse.json({ success: false, message: "Missing token" }, { status: 400 });
    }

    const googleUser = await verifyGoogleToken(token);
    if (!googleUser) {
      return NextResponse.json({ success: false, message: "Invalid Google token" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          avatar: googleUser.avatar,
          provider: "google",
          providerId: googleUser.providerId,
          emailVerified: true,
        },
      });
    }

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

    const response = NextResponse.json({
      success: true,
      message: "Google authentication successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          provider: user.provider,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
        accessToken,
      },
    });

    return setRefreshTokenCookie(response, refreshToken);
  } catch (error) {
    console.error("Google Callback POST error:", error);
    return NextResponse.json({ success: false, message: "Google authentication error" }, { status: 500 });
  }
}
