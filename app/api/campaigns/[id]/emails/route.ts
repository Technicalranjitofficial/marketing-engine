import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/campaigns/[id]/emails - Get campaign emails with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    // Build where clause
    const where: Record<string, unknown> = { campaignId: id };
    if (status) where.status = status;
    if (search) {
      where.contact = {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { queuedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.email.count({ where }),
    ]);

    // Get status breakdown
    const statusCounts = await prisma.email.groupBy({
      by: ["status"],
      where: { campaignId: id },
      _count: { id: true },
    });

    return NextResponse.json({
      emails,
      total,
      page,
      pages: Math.ceil(total / limit),
      statusCounts: statusCounts.reduce((acc, s) => {
        acc[s.status] = s._count.id;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error("Error fetching campaign emails:", error);
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}
