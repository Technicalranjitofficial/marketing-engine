import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { queueCampaign } from "@/lib/queue";

// GET /api/campaigns/[id] - Get campaign details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        list: true,
        template: true,
        abTest: true,
        _count: {
          select: { emails: true, events: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Get event breakdown
    const eventStats = await prisma.emailEvent.groupBy({
      by: ["type"],
      where: { campaignId: id },
      _count: { id: true },
    });

    return NextResponse.json({
      campaign,
      eventStats: eventStats.reduce((acc, e) => {
        acc[e.type] = e._count.id;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}

// PATCH /api/campaigns/[id] - Update campaign
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Don't allow updating sent campaigns
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    if (existing.status === "SENT" || existing.status === "SENDING") {
      return NextResponse.json({ error: "Cannot update sent/sending campaign" }, { status: 400 });
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id] - Delete campaign
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.campaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
