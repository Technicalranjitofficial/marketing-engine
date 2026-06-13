import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/stream — Server-Sent Events stream for real-time dashboard updates
// Pushes a stats snapshot every 5 seconds; client reconnects automatically.
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      const fetchSnapshot = async () => {
        try {
          const [
            totalContacts,
            activeContacts,
            totalCampaigns,
            sentCampaigns,
            emailAgg,
            recentCampaigns,
            queueAgg,
          ] = await Promise.all([
            prisma.contact.count(),
            prisma.contact.count({ where: { status: "ACTIVE" } }),
            prisma.campaign.count(),
            prisma.campaign.count({ where: { status: "SENT" } }),
            prisma.campaign.aggregate({
              where: { status: "SENT" },
              _sum: {
                totalSent: true,
                totalDelivered: true,
                totalOpened: true,
                totalClicked: true,
                totalBounced: true,
                totalComplaints: true,
                totalUnsubscribed: true,
              },
            }),
            prisma.campaign.findMany({
              orderBy: { createdAt: "desc" },
              take: 5,
              select: {
                id: true,
                name: true,
                status: true,
                sentAt: true,
                totalSent: true,
                totalDelivered: true,
                totalOpened: true,
                totalClicked: true,
                totalBounced: true,
              },
            }),
            // Active email jobs (SENDING status)
            prisma.email.count({ where: { status: "SENDING" } }),
          ]);

          const sum = emailAgg._sum;
          const totalSent = sum.totalSent || 0;
          const totalDelivered = sum.totalDelivered || 0;
          const totalOpened = sum.totalOpened || 0;
          const totalClicked = sum.totalClicked || 0;
          const totalBounced = sum.totalBounced || 0;

          send({
            ts: Date.now(),
            overview: {
              contacts: { total: totalContacts, active: activeContacts },
              campaigns: { total: totalCampaigns, sent: sentCampaigns },
              lists: 0, // not queried in stream for perf — use /api/stats for full count
            },
            emailStats: {
              totalSent,
              totalDelivered,
              totalOpened,
              totalClicked,
              totalBounced,
              totalComplaints: sum.totalComplaints || 0,
              totalUnsubscribed: sum.totalUnsubscribed || 0,
              openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0",
              clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0",
              deliveryRate: totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : "0",
              bounceRate: totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : "0",
            },
            recentCampaigns: recentCampaigns.map((c) => ({
              ...c,
              openRate: c.totalSent > 0 ? ((c.totalOpened / c.totalSent) * 100).toFixed(1) : "0",
              clickRate: c.totalSent > 0 ? ((c.totalClicked / c.totalSent) * 100).toFixed(1) : "0",
            })),
            activeEmailJobs: queueAgg,
          });
        } catch (err) {
          // Don't crash the stream on a DB error — just skip this tick
          console.error("[SSE] snapshot error:", err);
        }
      };

      // Send immediately, then every 5 s
      await fetchSnapshot();
      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        await fetchSnapshot();
      }, 5000);

      // Keep-alive comment every 20 s to prevent proxy timeouts
      const keepAlive = setInterval(() => {
        if (closed) { clearInterval(keepAlive); return; }
        try { controller.enqueue(encoder.encode(": ka\n\n")); } catch { closed = true; }
      }, 20000);

      // Cleanup when client disconnects
      return () => {
        closed = true;
        clearInterval(interval);
        clearInterval(keepAlive);
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}
