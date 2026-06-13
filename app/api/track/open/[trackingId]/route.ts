import { NextRequest, NextResponse } from "next/server";
import { queueTrackingEvent } from "@/lib/queue";

// GET /api/track/open/[trackingId] - Track email open (1x1 pixel)
export async function GET(request: NextRequest, { params }: { params: Promise<{ trackingId: string }> }) {
  try {
    const { trackingId } = await params;

    // Queue the tracking event
    await queueTrackingEvent("open", trackingId, {
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
    });

    // Return 1x1 transparent GIF
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );

    return new NextResponse(pixel, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch {
    // Always return the pixel even on error
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    return new NextResponse(pixel, {
      headers: { "Content-Type": "image/gif" },
    });
  }
}
