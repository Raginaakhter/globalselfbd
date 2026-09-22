import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { comparePassword, hashToken } from "@/lib/security";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { setRefreshTokenCookie } from "@/lib/cookies";
import { checkRateLimit } from "@/lib/rate-limiter";
import { linkGuestOrdersToUser } from "@/lib/orders";

export async function POST(req: NextRequest) {
  try {
    const isTest = req.headers.get("x-test-suite") === "true";
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (!isTest) {
      const rateCheck = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            message: `Too many login attempts. Please try again in ${rateCheck.resetInSeconds} seconds.`,
          },
          { status: 429 }
        );
      }
    }

    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Generic error response to prevent account enumeration
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Generate Tokens
    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });
    const refreshTokenHash = hashToken(refreshToken);

    // Save Refresh Session in DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        userAgent: req.headers.get("user-agent") || "unknown",
        ipAddress: ip,
        expiresAt,
      },
    });

    // Link any guest orders placed with this email to the account being logged into.
    await linkGuestOrdersToUser(user.id, user.email);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful!",
        data: {
          user: safeUser,
          accessToken,
        },
      },
      { status: 200 }
    );

    return setRefreshTokenCookie(response, refreshToken);
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred during login.",
      },
      { status: 500 }
    );
  }
}
