import { NextRequest, NextResponse } from "next/server";
import { verifyOtpSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { verifyOtp, hashToken } from "@/lib/security";
import { signResetToken } from "@/lib/jwt";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = verifyOtpSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 4-digit verification code.",
        },
        { status: 400 }
      );
    }

    const { email, otp } = parseResult.data;

    // Rate Limit OTP Guesses: Max 5 attempts per email
    const rateCheck = checkRateLimit(`verify-otp:${email}`, 5, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many invalid OTP attempts. Please request a new code in ${rateCheck.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const otpRecord = await prisma.passwordResetOtp.findUnique({
      where: { email },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired verification code.",
        },
        { status: 400 }
      );
    }

    // Check expiration
    if (otpRecord.expiresAt < new Date()) {
      await prisma.passwordResetOtp.delete({ where: { id: otpRecord.id } });
      return NextResponse.json(
        {
          success: false,
          message: "Verification code has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // Check attempt limit
    if (otpRecord.attempts >= 5) {
      await prisma.passwordResetOtp.delete({ where: { id: otpRecord.id } });
      return NextResponse.json(
        {
          success: false,
          message: "Maximum OTP attempts exceeded. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // Verify OTP code
    const isOtpValid = verifyOtp(otp, otpRecord.otpHash);
    if (!isOtpValid) {
      // Increment attempts
      await prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Invalid verification code. Please check and try again.",
        },
        { status: 400 }
      );
    }

    // Issue short-lived Reset Authorization Token (15 minutes)
    const resetToken = signResetToken(email);
    const resetTokenHash = hashToken(resetToken);

    // Update DB record with resetTokenHash and clear OTP hash
    await prisma.passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: {
        otpHash: "VERIFIED",
        resetTokenHash,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Verification code verified successfully!",
        data: {
          resetToken,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify OTP API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred during OTP verification.",
      },
      { status: 500 }
    );
  }
}
