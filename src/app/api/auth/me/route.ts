import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);

  if (errorResponse || !user) {
    return errorResponse || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      success: true,
      data: { user },
    },
    { status: 200 }
  );
}
