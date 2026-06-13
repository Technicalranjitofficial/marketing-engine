import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { QUEUES, createRedisConnection, AnalyticsJobData, TrackEventJob } from "../queue";

const prisma = new PrismaClient();

// ============================================
// ANALYTICS WORKER
// Processes tracking events (opens, clicks, etc.)
// ============================================

export function createAnalyticsWorker() {
  const worker = new Worker<AnalyticsJobData>(
    QUEUES.ANALYTICS,
    async (job: Job<AnalyticsJobData>) => {
      const data = job.data as TrackEventJob;
      return handleTrackEvent(data);
    },
    {
      connection: createRedisConnection(),
      concurrency: 20, // High concurrency for analytics
    }
  );

  worker.on("completed", (job) => {
    console.log(`[AnalyticsWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[AnalyticsWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

// ============================================
// EVENT HANDLERS
// ============================================

async function handleTrackEvent(data: TrackEventJob) {
  const { eventType, trackingId, metadata } = data;
  console.log(`[AnalyticsWorker] Processing ${eventType} event for ${trackingId}`);

  // Find the email by tracking ID (stored in headers)
  // For now, we'll use a lookup table or the messageId
  const email = await prisma.email.findFirst({
    where: {
      OR: [
        { messageId: { contains: trackingId } },
        // Additional lookup strategies can be added
      ],
    },
    include: { campaign: true },
  });

  if (!email) {
    console.log(`[AnalyticsWorker] Email not found for tracking ID: ${trackingId}`);
    return { found: false };
  }

  switch (eventType) {
    case "open":
      return handleOpen(email.id, email.campaignId, email.contactId);

    case "click":
      return handleClick(email.id, email.campaignId, email.contactId, metadata?.url as string);

    case "bounce":
      return handleBounce(email.id, email.campaignId, email.contactId, metadata?.bounceType as string);

    case "complaint":
      return handleComplaint(email.id, email.campaignId, email.contactId);

    case "unsubscribe":
      return handleUnsubscribe(email.id, email.campaignId, email.contactId);

    default:
      console.log(`[AnalyticsWorker] Unknown event type: ${eventType}`);
      return { unknown: true };
  }
}

async function handleOpen(emailId: string, campaignId: string, contactId: string) {
  // Check if already opened
  const email = await prisma.email.findUnique({
    where: { id: emailId },
  });

  if (!email) return { found: false };

  const isFirstOpen = email.status !== "OPENED" && email.status !== "CLICKED";

  // Update email status
  await prisma.email.update({
    where: { id: emailId },
    data: {
      status: email.status === "CLICKED" ? "CLICKED" : "OPENED",
      openedAt: email.openedAt || new Date(),
    },
  });

  // Create event
  await prisma.emailEvent.create({
    data: {
      emailId,
      campaignId,
      contactId,
      type: "OPENED",
    },
  });

  // Update contact stats
  if (isFirstOpen) {
    await prisma.contact.update({
      where: { id: contactId },
      data: {
        emailsOpened: { increment: 1 },
        lastOpenAt: new Date(),
        engagementScore: { increment: 5 },
      },
    });

    // Update campaign stats
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { totalOpened: { increment: 1 } },
    });
  }

  return { processed: true, firstOpen: isFirstOpen };
}

async function handleClick(emailId: string, campaignId: string, contactId: string, url?: string) {
  const email = await prisma.email.findUnique({
    where: { id: emailId },
  });

  if (!email) return { found: false };

  const isFirstClick = email.status !== "CLICKED";

  // Update email status
  await prisma.email.update({
    where: { id: emailId },
    data: {
      status: "CLICKED",
      clickedAt: email.clickedAt || new Date(),
    },
  });

  // Create event
  await prisma.emailEvent.create({
    data: {
      emailId,
      campaignId,
      contactId,
      type: "CLICKED",
      linkUrl: url,
    },
  });

  // Update contact stats
  if (isFirstClick) {
    await prisma.contact.update({
      where: { id: contactId },
      data: {
        emailsClicked: { increment: 1 },
        lastClickAt: new Date(),
        engagementScore: { increment: 10 },
      },
    });

    // Update campaign stats
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { totalClicked: { increment: 1 } },
    });
  }

  return { processed: true, firstClick: isFirstClick, url };
}

async function handleBounce(emailId: string, campaignId: string, contactId: string, bounceType?: string) {
  // Update email status
  await prisma.email.update({
    where: { id: emailId },
    data: {
      status: "BOUNCED",
      bouncedAt: new Date(),
    },
  });

  // Create event
  await prisma.emailEvent.create({
    data: {
      emailId,
      campaignId,
      contactId,
      type: "BOUNCED",
      metadata: { bounceType },
    },
  });

  // Get contact
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  });

  if (contact) {
    const newBounceCount = contact.bounceCount + 1;
    const isHardBounce = bounceType === "hard" || newBounceCount >= 3;

    await prisma.contact.update({
      where: { id: contactId },
      data: {
        bounceCount: newBounceCount,
        lastBounceAt: new Date(),
        status: isHardBounce ? "BOUNCED" : contact.status,
        engagementScore: { decrement: 20 },
      },
    });
  }

  // Update campaign stats
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { totalBounced: { increment: 1 } },
  });

  return { processed: true, bounceType };
}

async function handleComplaint(emailId: string, campaignId: string, contactId: string) {
  // Update email status
  await prisma.email.update({
    where: { id: emailId },
    data: { status: "COMPLAINED" },
  });

  // Create event
  await prisma.emailEvent.create({
    data: {
      emailId,
      campaignId,
      contactId,
      type: "COMPLAINED",
    },
  });

  // Update contact - mark as complained
  await prisma.contact.update({
    where: { id: contactId },
    data: {
      status: "COMPLAINED",
      engagementScore: 0,
    },
  });

  // Update campaign stats
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { totalComplaints: { increment: 1 } },
  });

  return { processed: true };
}

async function handleUnsubscribe(emailId: string, campaignId: string, contactId: string) {
  // Create event
  await prisma.emailEvent.create({
    data: {
      emailId,
      campaignId,
      contactId,
      type: "UNSUBSCRIBED",
    },
  });

  // Update contact
  await prisma.contact.update({
    where: { id: contactId },
    data: {
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
    },
  });

  // Update campaign stats
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { totalUnsubscribed: { increment: 1 } },
  });

  return { processed: true };
}

export default createAnalyticsWorker;
