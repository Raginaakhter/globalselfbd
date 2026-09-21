import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  provider: string;
  emailVerified: boolean;
  createdAt: Date;
}

/**
 * Authenticate incoming HTTP API request via Bearer Token or cookie
 */
export async function authenticateRequest(req: NextRequest): Promise<{
  user: AuthenticatedUser | null;
  errorResponse?: NextResponse;
}> {
  // Extract token from Authorization header or cookie
  let token: string | null = null;
  const authHeader = req.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Missing authentication token",
        },
        { status: 401 }
      ),
    };
  }

  const payload = verifyAccessToken(token);
  if (!payload || !payload.userId) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Token expired or invalid",
        },
        { status: 401 }
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      provider: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User account not found",
        },
        { status: 401 }
      ),
    };
  }

  return { user };
}
