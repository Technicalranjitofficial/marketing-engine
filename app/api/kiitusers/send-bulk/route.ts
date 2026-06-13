import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { renderTemplate } from "@/lib/templates";
import { queueDirectEmail } from "@/lib/queue";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/kiitusers/send-bulk
// Send a templated email to a list of KIITConnect users via the worker queue.
// Users are NOT required to exist in the Contact table — we create them on the
// fly (or upsert) so tracking and unsubscribe links work properly.
//
// Anti-spam measures:
//  - Each email is personalised (firstName in subject/body vars)
//  - List-Unsubscribe header injected by email.service.ts (DKIM already set up)
//  - Proper fromName / replyTo
//  - Subject & previewText are distinct and not spammy
// ─────────────────────────────────────────────────────────────────────────────

interface KIITUser {
  id       : string;
  name     : string;
  email    : string;
  isPremium: boolean;
}

const DEFAULT_FROM = process.env.DEFAULT_FROM_EMAIL || "support@kiitconnect.com";
const DEFAULT_NAME = process.env.DEFAULT_FROM_NAME  || "KIIT Connect";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      users,          // KIITUser[]  — selected users from the UI
      subject,        // string
      templateId,     // string
      templateVars = {},  // Record<string, string>  — shared vars; firstName / name overridden per user
      fromName  = DEFAULT_NAME,
      fromEmail = DEFAULT_FROM,
      replyTo,
    } = body as {
      users        : KIITUser[];
      subject      : string;
      templateId   : string;
      templateVars?: Record<string, string>;
      fromName?    : string;
      fromEmail?   : string;
      replyTo?     : string;
    };

    if (!users?.length)  return NextResponse.json({ error: "users[] is required" }, { status: 400 });
    if (!subject)        return NextResponse.json({ error: "subject is required" },  { status: 400 });
    if (!templateId)     return NextResponse.json({ error: "templateId is required" }, { status: 400 });

    // Create a single campaign for the whole batch
    const campaign = await prisma.campaign.create({
      data: {
        name            : `Bulk: ${subject} → ${users.length} KIITConnect users`,
        subject,
        htmlContent     : "",   // placeholder — emails have their own rendered HTML
        fromName,
        fromEmail,
        replyTo         : replyTo || fromEmail,
        status          : "SENDING",
        totalRecipients : users.length,
      },
    });

    let queued = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        const firstName = (user.name || "").split(/[\s_]+/)[0].replace(/^\d+/, "").trim() || "Student";
        const email     = user.email?.toLowerCase().trim();
        if (!email || !email.includes("@")) { errors.push(`bad email: ${user.email}`); continue; }

        // Upsert contact so tracking + unsubscribe work
        const contact = await prisma.contact.upsert({
          where : { email },
          update: { firstName, updatedAt: new Date() },
          create: {
            email,
            firstName,
            lastName : user.name.split(/[\s_]+/).slice(1).join(" ") || null,
            status   : "ACTIVE",
            source   : "kiitconnect",
          },
        });

        if (contact.status !== "ACTIVE") {
          errors.push(`${email}: status=${contact.status}, skipped`);
          continue;
        }

        // Create Email record FIRST — we need the ID for trackingId + unsubscribeUrl
        // Let Prisma generate the ID via @default(cuid()), then derive trackingId from it
        const emailRecord = await prisma.email.create({
          data: {
            campaignId : campaign.id,
            contactId  : contact.id,
            status     : "QUEUED",
          },
        });

        const trackingId     = `${emailRecord.id}-${Date.now()}`;
        const baseUrl        = process.env.BASE_URL || "http://localhost:3000";
        const unsubscribeUrl = `${baseUrl}/api/unsubscribe/${trackingId}`;

        // Render template with per-user vars (unsubscribeUrl is now real)
        const vars: Record<string, string> = {
          ...templateVars,
          firstName,
          name         : user.name,
          email,
          unsubscribeUrl,
        };
        const rendered = renderTemplate(templateId, vars);

        // Store trackingId on the email record
        await prisma.email.update({
          where: { id: emailRecord.id },
          data : { trackingId },
        });

        // Update campaign htmlContent on first iteration (for preview)
        if (queued === 0) {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data : { htmlContent: rendered },
          });
        }

        await queueDirectEmail({
          emailId     : emailRecord.id,
          campaignId  : campaign.id,
          contactId   : contact.id,
          to          : email,
          subject,
          html        : rendered,
          fromName,
          fromEmail,
          replyTo     : replyTo || fromEmail,
          trackingId,
        });

        queued++;
      } catch (e) {
        errors.push(`${user.email}: ${(e as Error).message}`);
      }
    }

    // If no emails were queued, cancel the campaign
    if (queued === 0) {
      await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "CANCELLED" } });
      return NextResponse.json({ error: "No emails queued", errors }, { status: 400 });
    }

    // Update totalRecipients to actual queued count
    await prisma.campaign.update({
      where: { id: campaign.id },
      data : { totalRecipients: queued },
    });

    return NextResponse.json({ ok: true, campaignId: campaign.id, queued, errors });
  } catch (err) {
    console.error("[send-bulk]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
