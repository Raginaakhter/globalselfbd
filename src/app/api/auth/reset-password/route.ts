import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { verifyResetToken } from "@/lib/jwt";
import { hashPassword, hashToken } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = resetPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((issue) => issue.message);
      return NextResponse.json(
        {
          success: false,
          message: errors[0] || "Password reset validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    const { resetToken, newPassword } = parseResult.data;

    // Verify Reset Authorization Token
    const decodedToken = verifyResetToken(resetToken);
    if (!decodedToken || !decodedToken.email) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired password reset authorization. Please restart the forgot password process.",
        },
        { status: 401 }
      );
    }

    const email = decodedToken.email;
    const resetTokenHash = hashToken(resetToken);

    // Verify token hash in DB
    const otpRecord = await prisma.passwordResetOtp.findUnique({
      where: { email },
    });

    if (!otpRecord || otpRecord.resetTokenHash !== resetTokenHash) {
      return NextResponse.json(
        {
          success: false,
          message: "Password reset authorization has already been used or is invalid.",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 404 }
      );
    }

    // Hash new password securely
    const newPasswordHash = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate reset token in DB
    await prisma.passwordResetOtp.delete({
      where: { id: otpRecord.id },
    });

    // Security best practice: Revoke all existing active refresh sessions for this user
    await prisma.refreshSession.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully! You can now log in with your new password.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset Password API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while updating your password.",
      },
      { status: 500 }
    );
  }
}
