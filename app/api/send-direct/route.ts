import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { renderTemplate } from "@/lib/templates";

// POST /api/send-direct - Send an email to a single contact immediately via the worker queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contactId,
      subject,
      fromName,
      fromEmail,
      replyTo,
      templateId,
      templateVars = {},
      htmlContent,
    } = body;

    if (!contactId || !subject || !fromEmail) {
      return NextResponse.json(
        { error: "contactId, subject, and fromEmail are required" },
        { status: 400 }
      );
    }

    // Get contact
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    if (contact.status !== "ACTIVE") {
      return NextResponse.json({ error: `Contact status is ${contact.status} — cannot send` }, { status: 400 });
    }

    if (!templateId && !htmlContent) {
      return NextResponse.json({ error: "templateId or htmlContent is required" }, { status: 400 });
    }

    // Create campaign + email records FIRST so we have IDs for the unsubscribe URL
    const campaign = await prisma.campaign.create({
      data: {
        name: `Direct: ${subject} → ${contact.email}`,
        subject,
        htmlContent: "", // filled in below after rendering
        fromName: fromName || process.env.DEFAULT_FROM_NAME || "Marketing Team",
        fromEmail,
        replyTo: replyTo || fromEmail,
        status: "SENDING",
        totalRecipients: 1,
      },
    });

    const trackingId = `${campaign.id}-${contact.id}`;
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe/${trackingId}`;

    // Resolve HTML — now we can inject the real unsubscribeUrl
    let html: string;
    if (templateId) {
      const vars: Record<string, string> = {
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email,
        unsubscribeUrl,
        ...templateVars,
      };
      html = renderTemplate(templateId, vars);
    } else {
      // Replace personalisation tags in raw HTML
      html = (htmlContent as string)
        .replace(/{{firstName}}/g, contact.firstName || "")
        .replace(/{{lastName}}/g, contact.lastName || "")
        .replace(/{{email}}/g, contact.email)
        .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);
    }

    // Persist rendered HTML back to campaign record
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { htmlContent: html },
    });

    const email = await prisma.email.create({
      data: {
        campaignId: campaign.id,
        contactId: contact.id,
        trackingId,
        status: "QUEUED",
      },
    });

    // Queue for sending via BullMQ
    const { queueDirectEmail } = await import("@/lib/queue");
    const job = await queueDirectEmail({
      emailId: email.id,
      campaignId: campaign.id,
      contactId: contact.id,
      to: contact.email,
      subject,
      html,
      fromName: fromName || process.env.DEFAULT_FROM_NAME || "Marketing Team",
      fromEmail,
      replyTo: replyTo || fromEmail,
      trackingId,
    });

    return NextResponse.json({
      success: true,
      message: `Email queued for ${contact.email}`,
      jobId: job.id,
      campaignId: campaign.id,
    });
  } catch (error) {
    console.error("Error sending direct email:", error);
    return NextResponse.json({ error: "Failed to queue email" }, { status: 500 });
  }
}
