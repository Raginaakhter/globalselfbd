import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  provider: string;
  role: string;
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
      role: true,
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

/**
 * Authenticate the request and additionally require the user to have the "admin" role.
 * Returns a 403 (rather than 401) when the user is authenticated but not an admin, since the
 * credentials themselves were valid — they just don't grant access to this resource.
 */
export async function requireAdmin(req: NextRequest): Promise<{
  user: AuthenticatedUser | null;
  errorResponse?: NextResponse;
}> {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse || !user) {
    return { user: null, errorResponse };
  }
  if (user.role !== "admin") {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, message: "Forbidden: Admin access required" },
        { status: 403 }
      ),
    };
  }
  return { user };
}
