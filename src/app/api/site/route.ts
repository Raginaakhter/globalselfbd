import { NextResponse } from "next/server";
import { getSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getSiteData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/site error:", error);
    return NextResponse.json({ success: false, message: "Failed to load site data" }, { status: 500 });
  }
}
