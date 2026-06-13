import { Queue } from "bullmq";

// ============================================
// FRONTEND QUEUE CLIENT
// Lightweight - only adds jobs, doesn't process
// ============================================

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

// Lazy-initialized connections
let _campaignQueue: Queue | null = null;
let _automationQueue: Queue | null = null;
let _analyticsQueue: Queue | null = null;

function getCampaignQueue() {
  if (!_campaignQueue) {
    _campaignQueue = new Queue("campaign-queue", {
      connection: redisConfig,
    });
  }
  return _campaignQueue;
}

function getAutomationQueue() {
  if (!_automationQueue) {
    _automationQueue = new Queue("automation-queue", {
      connection: redisConfig,
    });
  }
  return _automationQueue;
}

function getAnalyticsQueue() {
  if (!_analyticsQueue) {
    _analyticsQueue = new Queue("analytics-queue", {
      connection: redisConfig,
    });
  }
  return _analyticsQueue;
}

// ============================================
// JOB FUNCTIONS (for API routes)
// ============================================

export async function queueCampaign(campaignId: string) {
  const queue = getCampaignQueue();
  return queue.add(
    "send-campaign",
    { type: "send-campaign", campaignId },
    { jobId: `campaign-${campaignId}` }
  );
}

export async function queueAutomationTrigger(automationId: string, contactId: string) {
  const queue = getAutomationQueue();
  return queue.add(
    "automation-trigger",
    { type: "automation-trigger", automationId, contactId },
    { jobId: `trigger-${automationId}-${contactId}` }
  );
}

export async function queueTrackingEvent(
  eventType: "open" | "click" | "bounce" | "complaint" | "unsubscribe",
  trackingId: string,
  metadata?: Record<string, unknown>
) {
  const queue = getAnalyticsQueue();
  return queue.add(
    "track-event",
    { type: "track-event", eventType, trackingId, metadata },
    { jobId: `analytics-${trackingId}-${eventType}-${Date.now()}` }
  );
}

// ============================================
// QUEUE STATS (for dashboard)
// ============================================

export async function getQueueStats() {
  const queues = [
    { name: "email-queue", queue: new Queue("email-queue", { connection: redisConfig }) },
    { name: "campaign-queue", queue: getCampaignQueue() },
    { name: "automation-queue", queue: getAutomationQueue() },
    { name: "analytics-queue", queue: getAnalyticsQueue() },
  ];

  const stats = await Promise.all(
    queues.map(async ({ name, queue }) => {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);
      return { name, waiting, active, completed, failed };
    })
  );

  return stats;
}

export async function isRedisConnected(): Promise<boolean> {
  try {
    const queue = getCampaignQueue();
    await queue.getWaitingCount();
    return true;
  } catch {
    return false;
  }
}
