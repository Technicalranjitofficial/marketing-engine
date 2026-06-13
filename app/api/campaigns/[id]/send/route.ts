import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { queueCampaign } from "@/lib/queue";

// POST /api/campaigns/[id]/send - Queue campaign for sending
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { list: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: `Campaign cannot be sent - current status: ${campaign.status}` },
        { status: 400 }
      );
    }

    if (!campaign.listId && !campaign.segmentQuery) {
      return NextResponse.json(
        { error: "Campaign has no target list or segment" },
        { status: 400 }
      );
    }

    // Update status to scheduled
    await prisma.campaign.update({
      where: { id },
      data: { status: "SCHEDULED" },
    });

    // Queue the campaign for processing by the worker
    const job = await queueCampaign(id);

    return NextResponse.json({
      success: true,
      message: "Campaign queued for sending",
      jobId: job.id,
    });
  } catch (error) {
    console.error("Error sending campaign:", error);
    return NextResponse.json({ error: "Failed to queue campaign" }, { status: 500 });
  }
}
