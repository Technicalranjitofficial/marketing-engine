// GET /api/inbox/stream?lastId=xxx
// Server-Sent Events stream for real-time inbox updates
// Polls DB every 2 seconds and pushes new emails to the client

import { NextRequest } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  let lastId = searchParams.get("lastId") || "";
  let lastCount = parseInt(searchParams.get("lastCount") || "0");

  const encoder = new TextEncoder();
  let closed = false;
  let pingInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Send initial connection event
      send("connected", { status: "ok", timestamp: Date.now() });

      // Send ping every 15 seconds to keep connection alive (Cloudflare timeout is 100s)
      pingInterval = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          closed = true;
        }
      }, 15000);

      // Polling loop
      const poll = async () => {
        if (closed) return;

        try {
          // Get latest email and counts
          const [latest, total, unreadCount] = await Promise.all([
            prisma.inboundEmail.findFirst({
              orderBy: { receivedAt: "desc" },
              select: {
                id: true,
                subject: true,
                fromEmail: true,
                fromName: true,
                receivedAt: true,
                isRead: true,
              },
            }),
            prisma.inboundEmail.count(),
            prisma.inboundEmail.count({ where: { isRead: false } }),
          ]);

          // Check if there's a new email
          if (latest && latest.id !== lastId) {
            // New email arrived
            if (lastId !== "") {
              // Only send notification if not first poll
              send("new-email", {
                email: latest,
                total,
                unreadCount,
              });
            }
            lastId = latest.id;
          } else if (total !== lastCount) {
            // Count changed (email deleted or read status changed)
            send("update", { total, unreadCount });
          }

          lastCount = total;
        } catch (err) {
          console.error("[Inbox SSE] Poll error:", err);
        }

        // Schedule next poll
        if (!closed) {
          setTimeout(poll, 2000);
        }
      };

      // Start polling
      poll();

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        closed = true;
        if (pingInterval) clearInterval(pingInterval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      closed = true;
      if (pingInterval) clearInterval(pingInterval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
      "Access-Control-Allow-Origin": "*",
    },
  });
}
