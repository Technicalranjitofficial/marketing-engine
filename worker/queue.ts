import { Queue, Worker, QueueEvents, Job } from "bullmq";
import IORedis from "ioredis";

// ============================================
// REDIS CONNECTION
// ============================================

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

export const redis = new IORedis(redisConfig);

export const createRedisConnection = () => new IORedis(redisConfig);

// ============================================
// QUEUE DEFINITIONS
// ============================================

export const QUEUES = {
  EMAIL: "email-queue",
  CAMPAIGN: "campaign-queue",
  AUTOMATION: "automation-queue",
  ANALYTICS: "analytics-queue",
  CLEANUP: "cleanup-queue",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

// ============================================
// QUEUE INSTANCES
// ============================================

const defaultQueueOptions = {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential" as const,
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600, // 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 7 days
    },
  },
};

export const emailQueue = new Queue(QUEUES.EMAIL, defaultQueueOptions);
export const campaignQueue = new Queue(QUEUES.CAMPAIGN, defaultQueueOptions);
export const automationQueue = new Queue(QUEUES.AUTOMATION, defaultQueueOptions);
export const analyticsQueue = new Queue(QUEUES.ANALYTICS, defaultQueueOptions);
export const cleanupQueue = new Queue(QUEUES.CLEANUP, defaultQueueOptions);

// ============================================
// QUEUE EVENTS (for monitoring)
// ============================================

export const createQueueEvents = (queueName: QueueName) => {
  return new QueueEvents(queueName, {
    connection: createRedisConnection(),
  });
};

// ============================================
// JOB TYPES
// ============================================

export interface SendEmailJob {
  type: "send-email";
  emailId: string;
  campaignId: string;
  contactId: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  trackingId: string;
}

export interface SendCampaignJob {
  type: "send-campaign";
  campaignId: string;
}

export interface ProcessBatchJob {
  type: "process-batch";
  campaignId: string;
  batchIndex: number;
  contactIds: string[];
}

export interface AutomationTriggerJob {
  type: "automation-trigger";
  automationId: string;
  contactId: string;
  triggerData?: Record<string, unknown>;
}

export interface AutomationStepJob {
  type: "automation-step";
  runId: string;
  automationId: string;
  contactId: string;
  stepIndex: number;
}

export interface TrackEventJob {
  type: "track-event";
  eventType: "open" | "click" | "bounce" | "complaint" | "unsubscribe";
  trackingId: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateStatsJob {
  type: "update-stats";
  campaignId: string;
}

export interface CleanupJob {
  type: "cleanup";
  task: "expired-tokens" | "old-logs" | "stale-jobs";
}

export type EmailJobData = SendEmailJob;
export type CampaignJobData = SendCampaignJob | ProcessBatchJob | UpdateStatsJob;
export type AutomationJobData = AutomationTriggerJob | AutomationStepJob;
export type AnalyticsJobData = TrackEventJob;
export type CleanupJobData = CleanupJob;

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function addEmailJob(data: SendEmailJob, options?: { priority?: number; delay?: number }) {
  return emailQueue.add(data.type, data, {
    priority: options?.priority ?? 0,
    delay: options?.delay,
    jobId: `email-${data.emailId}`,
  });
}

export async function addCampaignJob(data: CampaignJobData, options?: { priority?: number; delay?: number }) {
  const jobId = data.type === "send-campaign" 
    ? `campaign-${data.campaignId}` 
    : data.type === "process-batch"
    ? `batch-${data.campaignId}-${data.batchIndex}`
    : `stats-${data.campaignId}-${Date.now()}`;
    
  return campaignQueue.add(data.type, data, {
    priority: options?.priority ?? 0,
    delay: options?.delay,
    jobId,
  });
}

export async function addAutomationJob(data: AutomationJobData, options?: { priority?: number; delay?: number }) {
  const jobId = data.type === "automation-trigger"
    ? `trigger-${data.automationId}-${data.contactId}`
    : `step-${data.runId}-${data.stepIndex}`;
    
  return automationQueue.add(data.type, data, {
    priority: options?.priority ?? 0,
    delay: options?.delay,
    jobId,
  });
}

export async function addAnalyticsJob(data: AnalyticsJobData) {
  return analyticsQueue.add(data.type, data, {
    jobId: `analytics-${data.trackingId}-${data.eventType}-${Date.now()}`,
  });
}

export async function addCleanupJob(data: CleanupJobData) {
  return cleanupQueue.add(data.type, data, {
    jobId: `cleanup-${data.task}-${Date.now()}`,
  });
}

// ============================================
// QUEUE STATS
// ============================================

export async function getQueueStats(queueName: QueueName) {
  const queue = {
    [QUEUES.EMAIL]: emailQueue,
    [QUEUES.CAMPAIGN]: campaignQueue,
    [QUEUES.AUTOMATION]: automationQueue,
    [QUEUES.ANALYTICS]: analyticsQueue,
    [QUEUES.CLEANUP]: cleanupQueue,
  }[queueName];

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

export async function getAllQueueStats() {
  const stats = await Promise.all(
    Object.values(QUEUES).map(async (name) => ({
      name,
      ...(await getQueueStats(name)),
    }))
  );
  return stats;
}
