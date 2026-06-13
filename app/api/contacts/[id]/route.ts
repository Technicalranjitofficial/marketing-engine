import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/contacts/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        lists: { include: { list: { select: { id: true, name: true } } } },
      },
    });
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    return NextResponse.json({ contact });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch contact" }, { status: 500 });
  }
}

// PATCH /api/contacts/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, phone, company, status, customFields } = body;

    const contact = await prisma.contact.update({
      where: { id },
      data: { firstName, lastName, phone, company, status, customFields },
    });
    return NextResponse.json({ contact });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

// DELETE /api/contacts/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
