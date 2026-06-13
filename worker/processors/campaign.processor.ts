import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import {
  QUEUES,
  createRedisConnection,
  CampaignJobData,
  SendCampaignJob,
  ProcessBatchJob,
  UpdateStatsJob,
  addEmailJob,
  addCampaignJob,
} from "../queue";
import { compileTemplate } from "../services/email.service";

const prisma = new PrismaClient();

const BATCH_SIZE = 100; // Process 100 contacts per batch

// ============================================
// CAMPAIGN WORKER
// Handles campaign orchestration and batching
// ============================================

export function createCampaignWorker() {
  const worker = new Worker<CampaignJobData>(
    QUEUES.CAMPAIGN,
    async (job: Job<CampaignJobData>) => {
      switch (job.data.type) {
        case "send-campaign":
          return handleSendCampaign(job.data);
        case "process-batch":
          return handleProcessBatch(job.data);
        case "update-stats":
          return handleUpdateStats(job.data);
        default:
          throw new Error(`Unknown job type: ${(job.data as { type: string }).type}`);
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[CampaignWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[CampaignWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

// ============================================
// JOB HANDLERS
// ============================================

async function handleSendCampaign(data: SendCampaignJob) {
  const { campaignId } = data;
  console.log(`[CampaignWorker] Starting campaign ${campaignId}`);

  // Get campaign details
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { list: true },
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  if (campaign.status !== "SCHEDULED" && campaign.status !== "DRAFT") {
    throw new Error(`Campaign ${campaignId} is not in sendable state: ${campaign.status}`);
  }

  // Update campaign status
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "SENDING", sentAt: new Date() },
  });

  // Get target contacts
  let contactIds: string[];

  if (campaign.listId) {
    // Get contacts from list
    const members = await prisma.contactListMember.findMany({
      where: { listId: campaign.listId },
      select: { contactId: true },
    });
    contactIds = members.map((m) => m.contactId);
  } else if (campaign.segmentQuery) {
    // TODO: Implement segment query parsing
    contactIds = [];
  } else {
    throw new Error("Campaign has no target list or segment");
  }

  // Filter active contacts only
  const activeContacts = await prisma.contact.findMany({
    where: {
      id: { in: contactIds },
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const activeContactIds = activeContacts.map((c) => c.id);
  const totalRecipients = activeContactIds.length;

  // Update total recipients
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { totalRecipients },
  });

  console.log(`[CampaignWorker] Campaign ${campaignId} targeting ${totalRecipients} contacts`);

  // Split into batches and queue
  const batches = [];
  for (let i = 0; i < activeContactIds.length; i += BATCH_SIZE) {
    batches.push(activeContactIds.slice(i, i + BATCH_SIZE));
  }

  // Queue each batch
  for (let i = 0; i < batches.length; i++) {
    await addCampaignJob(
      {
        type: "process-batch",
        campaignId,
        batchIndex: i,
        contactIds: batches[i],
      },
      { delay: i * 1000 } // Stagger batches by 1 second
    );
  }

  console.log(`[CampaignWorker] Queued ${batches.length} batches for campaign ${campaignId}`);

  return { totalRecipients, batchCount: batches.length };
}

async function handleProcessBatch(data: ProcessBatchJob) {
  const { campaignId, batchIndex, contactIds } = data;
  console.log(`[CampaignWorker] Processing batch ${batchIndex} for campaign ${campaignId}`);

  // Get campaign
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign || campaign.status !== "SENDING") {
    console.log(`[CampaignWorker] Campaign ${campaignId} is no longer sending, skipping batch`);
    return { skipped: true };
  }

  // Get contacts
  const contacts = await prisma.contact.findMany({
    where: {
      id: { in: contactIds },
      status: "ACTIVE",
    },
  });

  // Create email records and queue jobs
  let queuedCount = 0;

  for (const contact of contacts) {
    const trackingId = nanoid(16);

    // Compile template with contact data
    const templateData = {
      contact: {
        email: contact.email,
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        company: contact.company || "",
        ...((contact.customFields as Record<string, unknown>) || {}),
      },
      campaign: {
        name: campaign.name,
        subject: campaign.subject,
      },
      unsubscribeUrl: `${process.env.BASE_URL}/api/unsubscribe/${trackingId}`,
      preferencesUrl: `${process.env.BASE_URL}/preferences/${trackingId}`,
    };

    const personalizedHtml = compileTemplate(campaign.htmlContent, templateData);
    const personalizedSubject = compileTemplate(campaign.subject, templateData);

    // Create email record
    const email = await prisma.email.create({
      data: {
        campaignId,
        contactId: contact.id,
        trackingId,
        status: "QUEUED",
      },
    });

    // Queue email job
    await addEmailJob({
      type: "send-email",
      emailId: email.id,
      campaignId,
      contactId: contact.id,
      to: contact.email,
      subject: personalizedSubject,
      html: personalizedHtml,
      text: campaign.textContent || undefined,
      fromName: campaign.fromName,
      fromEmail: campaign.fromEmail,
      replyTo: campaign.replyTo || undefined,
      trackingId,
    });

    queuedCount++;
  }

  console.log(`[CampaignWorker] Batch ${batchIndex}: Queued ${queuedCount} emails`);

  return { batchIndex, queuedCount };
}

async function handleUpdateStats(data: UpdateStatsJob) {
  const { campaignId } = data;

  // Aggregate stats from email records
  const stats = await prisma.email.groupBy({
    by: ["status"],
    where: { campaignId },
    _count: { id: true },
  });

  const statusCounts = stats.reduce(
    (acc, s) => {
      acc[s.status] = s._count.id;
      return acc;
    },
    {} as Record<string, number>
  );

  // Update campaign
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      totalSent: statusCounts.SENT || 0,
      totalDelivered: statusCounts.DELIVERED || 0,
      totalOpened: statusCounts.OPENED || 0,
      totalClicked: statusCounts.CLICKED || 0,
      totalBounced: statusCounts.BOUNCED || 0,
    },
  });

  // Check if campaign is complete
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (campaign) {
    const totalProcessed =
      (statusCounts.SENT || 0) +
      (statusCounts.FAILED || 0) +
      (statusCounts.BOUNCED || 0);

    if (totalProcessed >= campaign.totalRecipients) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "SENT",
          completedAt: new Date(),
        },
      });
      console.log(`[CampaignWorker] Campaign ${campaignId} completed`);
    }
  }

  return { updated: true };
}

export default createCampaignWorker;
