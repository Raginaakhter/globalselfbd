import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { generate4DigitOtp, hashOtp } from "@/lib/security";
import { sendOtpEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = forgotPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    const { email } = parseResult.data;

    // Rate Limiting by email/IP: max 3 requests per 15 minutes with 60-second cooldown
    const rateCheck = checkRateLimit(`forgot-password:${email}`, 3, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many password reset requests. Please try again in ${rateCheck.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Generic response to avoid revealing whether an email exists
    const genericResponse = NextResponse.json(
      {
        success: true,
        message: "Please check your email for the verification code.",
      },
      { status: 200 }
    );

    if (!user) {
      return genericResponse;
    }

    // Generate secure 4-digit OTP
    const otp = generate4DigitOtp();
    const otpHash = hashOtp(otp);

    // Expire in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Upsert OTP record (invalidates previous OTP)
    await prisma.passwordResetOtp.upsert({
      where: { email },
      update: {
        otpHash,
        resetTokenHash: null,
        attempts: 0,
        expiresAt,
      },
      create: {
        email,
        otpHash,
        attempts: 0,
        expiresAt,
      },
    });

    // Send Email
    await sendOtpEmail(email, otp, user.name);

    return genericResponse;
  } catch (error) {
    console.error("Forgot Password API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}
