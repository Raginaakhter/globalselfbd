import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validation";
import { sanitizeInput } from "@/lib/security";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);

  if (errorResponse || !user) {
    return errorResponse || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      success: true,
      message: "Protected user profile fetched successfully",
      data: {
        profile: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          provider: user.provider,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
      },
    },
    { status: 200 }
  );
}

export async function PATCH(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);

  if (errorResponse || !user) {
    return errorResponse || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message || "Invalid profile data" },
      { status: 400 }
    );
  }

  const { name, avatar } = parsed.data;
  if (avatar && !/^https?:\/\//i.test(avatar)) {
    return NextResponse.json({ success: false, message: "Avatar must be an http(s) URL" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: sanitizeInput(name),
      ...(avatar !== undefined && { avatar: avatar || null }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      provider: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    { success: true, message: "Profile updated successfully", data: { profile: updated } },
    { status: 200 }
  );
}
