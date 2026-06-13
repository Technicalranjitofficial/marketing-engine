import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Simple password-based auth
// Set ADMIN_PASSWORD env var or default to a secure fallback
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "kiitconnect@admin2024";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Create a session token (simple hash for now)
    const sessionToken = Buffer.from(`admin:${Date.now()}:${ADMIN_PASSWORD}`).toString("base64");

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set("marketing_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
