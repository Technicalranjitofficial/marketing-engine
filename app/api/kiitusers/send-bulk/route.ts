import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import prisma from "@/lib/db";
import { renderTemplate, getTemplateById } from "@/lib/templates";
import { queueDirectEmail } from "@/lib/queue";

// Helper to render custom templates from database
async function renderCustomTemplate(templateId: string, vars: Record<string, string>): Promise<string | null> {
  const customTemplate = await prisma.emailTemplate.findUnique({
    where: { id: templateId },
    select: { htmlContent: true },
  });
  if (!customTemplate?.htmlContent) return null;
  
  // Replace all template variables
  let html = customTemplate.htmlContent;
  for (const [key, value] of Object.entries(vars)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return html;
}

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
      campaignName,   // string
      batch,          // string
      templateName,   // string
      subject,        // string
      templateId,     // string
      templateVars = {},  // Record<string, string>  — shared vars; firstName / name overridden per user
      fromName  = DEFAULT_NAME,
      fromEmail = DEFAULT_FROM,
      replyTo,
    } = body as {
      users        : KIITUser[];
      campaignName?: string;
      batch?       : string;
      templateName?: string;
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

    // Check if template exists (hardcoded or custom)
    const isHardcodedTemplate = !!getTemplateById(templateId);
    let customTemplateHtml: string | null = null;
    if (!isHardcodedTemplate) {
      const customTemplate = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
        select: { htmlContent: true },
      });
      if (!customTemplate?.htmlContent) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      customTemplateHtml = customTemplate.htmlContent;
    }

    // Create a single campaign for the whole batch
    const campaign = await prisma.campaign.create({
      data: {
        name            : campaignName || `Bulk: ${subject} → ${users.length} KIITConnect users`,
        subject,
        htmlContent     : "",   // placeholder — emails have their own rendered HTML
        fromName,
        fromEmail,
        replyTo         : replyTo || fromEmail,
        status          : "SENDING",
        totalRecipients : users.length,
        segmentQuery    : {
          source: "kiitconnect",
          batch: batch || "All",
          topic: campaignName || subject,
          templateName: templateName || "Unknown"
        }
      },
    });

    let queued = 0;
    const errors: string[] = [];
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    // Process in parallel batches of 25 to avoid blocking the event loop
    const BATCH_SIZE = 25;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (user) => {
        try {
          const firstName = (user.name || "").split(/[\s_]+/)[0].replace(/^\d+/, "").trim() || "Student";
          const email     = user.email?.toLowerCase().trim();
          const validEmail = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(email ?? "");
          if (!email || !validEmail) { errors.push(`bad email: ${user.email}`); return; }

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
            return;
          }

          // Generate trackingId before DB insert — eliminates the extra update call
          const trackingId     = nanoid();
          const unsubscribeUrl = `${baseUrl}/api/unsubscribe/${trackingId}`;

          const emailRecord = await prisma.email.create({
            data: {
              campaignId : campaign.id,
              contactId  : contact.id,
              status     : "QUEUED",
              trackingId,
            },
          });

          const vars: Record<string, string> = {
            ...templateVars,
            firstName,
            name         : user.name,
            email,
            unsubscribeUrl,
          };

          let rendered: string;
          if (isHardcodedTemplate) {
            rendered = renderTemplate(templateId, vars);
          } else {
            rendered = customTemplateHtml!;
            for (const [key, value] of Object.entries(vars)) {
              rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
            }
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
      }));
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
