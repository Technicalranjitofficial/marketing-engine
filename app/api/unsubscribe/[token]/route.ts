import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { queueTrackingEvent } from "@/lib/queue";

// GET /api/unsubscribe/[token] - Show unsubscribe page
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  // Redirect to unsubscribe page
  return NextResponse.redirect(new URL(`/unsubscribe?token=${token}`, request.url));
}

// POST /api/unsubscribe/[token] - Process unsubscribe
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    // Find the unsubscribe token
    const record = await prisma.unsubscribeToken.findUnique({
      where: { token },
    });

    if (!record) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (record.used) {
      return NextResponse.json({ error: "Already unsubscribed" }, { status: 400 });
    }

    if (record.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    // Mark token as used
    await prisma.unsubscribeToken.update({
      where: { token },
      data: { used: true, usedAt: new Date() },
    });

    // Update contact
    const contact = await prisma.contact.updateMany({
      where: { email: record.email },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
      },
    });

    // Queue tracking event
    await queueTrackingEvent("unsubscribe", token, { email: record.email });

    return NextResponse.json({
      success: true,
      message: "Successfully unsubscribed",
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
