import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/stream — On-demand dashboard stats snapshot (called on manual refresh)
export async function GET() {
  try {
    const [
      totalContacts,
      activeContacts,
      totalCampaigns,
      sentCampaigns,
      emailAgg,
      recentCampaigns,
      activeEmailJobs,
      inboxUnread,
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
      prisma.email.count({ where: { status: "SENDING" } }),
      prisma.inboundEmail.count({ where: { isRead: false } }),
    ]);

    const sum = emailAgg._sum;
    const totalSent = sum.totalSent || 0;
    const totalDelivered = sum.totalDelivered || 0;
    const totalOpened = sum.totalOpened || 0;
    const totalClicked = sum.totalClicked || 0;
    const totalBounced = sum.totalBounced || 0;

    return NextResponse.json({
      ts: Date.now(),
      overview: {
        contacts: { total: totalContacts, active: activeContacts },
        campaigns: { total: totalCampaigns, sent: sentCampaigns },
        lists: 0,
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
      activeEmailJobs,
      inboxUnread,
    });
  } catch (err) {
    console.error("[/api/stream] snapshot error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
