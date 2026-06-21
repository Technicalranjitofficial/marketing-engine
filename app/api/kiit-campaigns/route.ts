import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Filter campaigns where segmentQuery contains source: 'kiitconnect'
    // Prisma JSON filtering varies by DB, so filtering in memory is safe 
    // for small/medium datasets, or we can use raw/Prisma json filtering if needed.
    const kiitCampaigns = campaigns.filter(c => {
      if (!c.segmentQuery || typeof c.segmentQuery !== 'object') return false;
      const sq = c.segmentQuery as Record<string, any>;
      return sq.source === "kiitconnect";
    });

    return NextResponse.json({ campaigns: kiitCampaigns });
  } catch (err) {
    console.error("[kiit-campaigns]", err);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}
