import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/lists/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const list = await prisma.contactList.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true, campaigns: true } },
        members: {
          take: 50,
          include: { contact: { select: { id: true, email: true, firstName: true, lastName: true, status: true } } },
        },
      },
    });
    if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });
    return NextResponse.json({ list });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch list" }, { status: 500 });
  }
}

// PATCH /api/lists/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, description } = await request.json();
    const list = await prisma.contactList.update({ where: { id }, data: { name, description } });
    return NextResponse.json({ list });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update list" }, { status: 500 });
  }
}

// DELETE /api/lists/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.contactList.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete list" }, { status: 500 });
  }
}
