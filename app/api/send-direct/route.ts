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

    // Resolve HTML from template or raw html
    let html: string;
    if (templateId) {
      const vars: Record<string, string> = {
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email,
        ...templateVars,
      };
      html = renderTemplate(templateId, vars);
    } else if (htmlContent) {
      // Replace personalisation tags
      html = htmlContent
        .replace(/{{firstName}}/g, contact.firstName || "")
        .replace(/{{lastName}}/g, contact.lastName || "")
        .replace(/{{email}}/g, contact.email);
    } else {
      return NextResponse.json({ error: "templateId or htmlContent is required" }, { status: 400 });
    }

    // Create a "one-off" campaign record so stats are tracked
    const campaign = await prisma.campaign.create({
      data: {
        name: `Direct: ${subject} → ${contact.email}`,
        subject,
        htmlContent: html,
        fromName: fromName || process.env.DEFAULT_FROM_NAME || "Marketing Team",
        fromEmail,
        replyTo: replyTo || fromEmail,
        status: "SENDING",
        totalRecipients: 1,
      },
    });

    // Create email record
    const trackingId = `${campaign.id}-${contact.id}`;
    const email = await prisma.email.create({
      data: {
        campaignId: campaign.id,
        contactId: contact.id,
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
