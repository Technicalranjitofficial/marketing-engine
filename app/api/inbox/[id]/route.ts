import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/inbox/[id]  — fetch full email (including htmlBody) + mark as read
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = await prisma.inboundEmail.findUnique({ where: { id } });
  if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auto-mark as read on open
  if (!email.isRead) {
    await prisma.inboundEmail.update({ where: { id }, data: { isRead: true } });
    email.isRead = true;
  }

  return NextResponse.json(email);
}

// PATCH /api/inbox/[id]  { isRead: boolean }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }  = await params;
  const body    = await req.json().catch(() => null);
  if (typeof body?.isRead !== "boolean")
    return NextResponse.json({ error: "isRead (boolean) required" }, { status: 400 });

  const email = await prisma.inboundEmail.update({
    where: { id },
    data : { isRead: body.isRead },
  });
  return NextResponse.json(email);
}

// DELETE /api/inbox/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.inboundEmail.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
