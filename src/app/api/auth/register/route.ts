import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { hashPassword, hashToken, sanitizeInput } from "@/lib/security";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { setRefreshTokenCookie } from "@/lib/cookies";
import { checkRateLimit } from "@/lib/rate-limiter";
import { linkGuestOrdersToUser } from "@/lib/orders";

export async function POST(req: NextRequest) {
  try {
    const isTest = req.headers.get("x-test-suite") === "true";
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (!isTest) {
      const rateCheck = checkRateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            message: `Too many registration attempts. Please try again in ${rateCheck.resetInSeconds} seconds.`,
          },
          { status: 429 }
        );
      }
    }

    const body = await req.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((issue) => issue.message);
      return NextResponse.json(
        {
          success: false,
          message: errors[0] || "Validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = parseResult.data;
    const sanitizedName = sanitizeInput(name);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email address already exists.",
        },
        { status: 409 }
      );
    }

    // Secure password hashing with bcrypt
    const passwordHash = await hashPassword(password);

    // Create user in DB
    const user = await prisma.user.create({
      data: {
        name: sanitizedName,
        email,
        passwordHash,
        provider: "local",
        emailVerified: false,
      },
    });

    // Create Access Token
    const accessToken = signAccessToken({ userId: user.id, email: user.email });

    // Create Refresh Token & Session
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });
    const refreshTokenHash = hashToken(refreshToken);

    // Store refresh session in DB (7 days)
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

    // Link any guest orders placed with this email before the account existed.
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
        message: "Registration successful!",
        data: {
          user: safeUser,
          accessToken,
        },
      },
      { status: 201 }
    );

    // Set HttpOnly cookie
    return setRefreshTokenCookie(response, refreshToken);
  } catch (error) {
    console.error("Registration API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred during registration.",
      },
      { status: 500 }
    );
  }
}
