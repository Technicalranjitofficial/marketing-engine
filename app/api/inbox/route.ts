import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET /api/inbox?page=1&limit=20&unread=true&search=foo
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, parseInt(searchParams.get("page")  || "1"));
  const limit  = Math.min(50, parseInt(searchParams.get("limit") || "20"));
  const unread = searchParams.get("unread") === "true";
  const search = searchParams.get("search")?.trim() || "";

  const where: Prisma.InboundEmailWhereInput = {};
  if (unread) where.isRead = false;
  if (search) {
    where.OR = [
      { subject   : { contains: search, mode: "insensitive" } },
      { fromEmail : { contains: search, mode: "insensitive" } },
      { fromName  : { contains: search, mode: "insensitive" } },
      { textBody  : { contains: search, mode: "insensitive" } },
    ];
  }

  const [emails, total, unreadCount] = await Promise.all([
    prisma.inboundEmail.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      skip   : (page - 1) * limit,
      take   : limit,
      select : {
        id        : true,
        messageId : true,
        subject   : true,
        fromEmail : true,
        fromName  : true,
        toEmail   : true,
        textBody  : true,
        isRead    : true,
        contactId : true,
        campaignId: true,
        receivedAt: true,
      },
    }),
    prisma.inboundEmail.count({ where }),
    prisma.inboundEmail.count({ where: { isRead: false } }),
  ]);

  return NextResponse.json({
    emails,
    total,
    unreadCount,
    page,
    pages: Math.ceil(total / limit),
  });
}

// PATCH /api/inbox  { markAllRead: true }
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (body?.markAllRead) {
    await prisma.inboundEmail.updateMany({
      where: { isRead: false },
      data : { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
