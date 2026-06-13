import { NextRequest, NextResponse } from "next/server";
import { queueTrackingEvent } from "@/lib/queue";

// GET /api/track/click/[trackingId] - Track link click and redirect
export async function GET(request: NextRequest, { params }: { params: Promise<{ trackingId: string }> }) {
  try {
    const { trackingId } = await params;
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Queue the tracking event
    await queueTrackingEvent("click", trackingId, {
      url: decodeURIComponent(url),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
    });

    // Redirect to the actual URL
    return NextResponse.redirect(decodeURIComponent(url));
  } catch {
    // On error, try to redirect anyway
    const url = new URL(request.url).searchParams.get("url");
    if (url) {
      return NextResponse.redirect(decodeURIComponent(url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }
}
