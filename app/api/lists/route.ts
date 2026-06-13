import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/lists - Get all lists
export async function GET() {
  try {
    const lists = await prisma.contactList.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true, campaigns: true } },
      },
    });

    return NextResponse.json({ lists });
  } catch (error) {
    console.error("Error fetching lists:", error);
    return NextResponse.json({ error: "Failed to fetch lists" }, { status: 500 });
  }
}

// POST /api/lists - Create list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type = "STATIC", filters } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const list = await prisma.contactList.create({
      data: {
        name,
        description,
        type,
        filters,
      },
    });

    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    console.error("Error creating list:", error);
    return NextResponse.json({ error: "Failed to create list" }, { status: 500 });
  }
}
