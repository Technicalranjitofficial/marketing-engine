import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import {
  QUEUES,
  createRedisConnection,
  AutomationJobData,
  AutomationTriggerJob,
  AutomationStepJob,
  addAutomationJob,
  addEmailJob,
} from "../queue";
import { compileTemplate } from "../services/email.service";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

// ============================================
// AUTOMATION WORKER
// Handles drip campaigns and triggered workflows
// ============================================

export function createAutomationWorker() {
  const worker = new Worker<AutomationJobData>(
    QUEUES.AUTOMATION,
    async (job: Job<AutomationJobData>) => {
      switch (job.data.type) {
        case "automation-trigger":
          return handleAutomationTrigger(job.data);
        case "automation-step":
          return handleAutomationStep(job.data);
        default:
          throw new Error(`Unknown job type: ${(job.data as { type: string }).type}`);
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[AutomationWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[AutomationWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

// ============================================
// JOB HANDLERS
// ============================================

async function handleAutomationTrigger(data: AutomationTriggerJob) {
  const { automationId, contactId, triggerData } = data;
  console.log(`[AutomationWorker] Triggering automation ${automationId} for contact ${contactId}`);

  // Get automation
  const automation = await prisma.automation.findUnique({
    where: { id: automationId },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });

  if (!automation || automation.status !== "ACTIVE") {
    console.log(`[AutomationWorker] Automation ${automationId} is not active`);
    return { skipped: true };
  }

  // Check if contact is already in this automation
  const existingRun = await prisma.automationRun.findUnique({
    where: {
      automationId_contactId: { automationId, contactId },
    },
  });

  if (existingRun && existingRun.status === "ACTIVE") {
    console.log(`[AutomationWorker] Contact ${contactId} already in automation ${automationId}`);
    return { skipped: true, reason: "already_active" };
  }

  // Create automation run
  const run = await prisma.automationRun.upsert({
    where: {
      automationId_contactId: { automationId, contactId },
    },
    create: {
      automationId,
      contactId,
      currentStep: 0,
      status: "ACTIVE",
    },
    update: {
      currentStep: 0,
      status: "ACTIVE",
      startedAt: new Date(),
      completedAt: null,
    },
  });

  // Update automation stats
  await prisma.automation.update({
    where: { id: automationId },
    data: {
      totalEntered: { increment: 1 },
      totalActive: { increment: 1 },
    },
  });

  // Queue first step
  if (automation.steps.length > 0) {
    const firstStep = automation.steps[0];
    const delayMs = calculateDelayMs(firstStep.delayValue, firstStep.delayUnit);

    await addAutomationJob(
      {
        type: "automation-step",
        runId: run.id,
        automationId,
        contactId,
        stepIndex: 0,
      },
      { delay: delayMs }
    );

    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: "WAITING",
        nextStepAt: new Date(Date.now() + delayMs),
      },
    });
  }

  return { runId: run.id, started: true };
}

async function handleAutomationStep(data: AutomationStepJob) {
  const { runId, automationId, contactId, stepIndex } = data;
  console.log(`[AutomationWorker] Processing step ${stepIndex} for run ${runId}`);

  // Get automation run and step
  const run = await prisma.automationRun.findUnique({
    where: { id: runId },
  });

  if (!run || run.status !== "WAITING") {
    console.log(`[AutomationWorker] Run ${runId} is not waiting`);
    return { skipped: true };
  }

  const automation = await prisma.automation.findUnique({
    where: { id: automationId },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });

  if (!automation || automation.status !== "ACTIVE") {
    await prisma.automationRun.update({
      where: { id: runId },
      data: { status: "CANCELLED" },
    });
    return { skipped: true, reason: "automation_inactive" };
  }

  const step = automation.steps[stepIndex];
  if (!step) {
    // No more steps - complete
    await completeAutomationRun(runId, automationId);
    return { completed: true };
  }

  // Get contact
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  });

  if (!contact || contact.status !== "ACTIVE") {
    await prisma.automationRun.update({
      where: { id: runId },
      data: { status: "CANCELLED" },
    });
    return { skipped: true, reason: "contact_inactive" };
  }

  // Process step based on type
  const stepConfig = step.config as Record<string, unknown>;

  switch (step.stepType) {
    case "SEND_EMAIL":
      await processSendEmailStep(contact, stepConfig, automationId);
      break;

    case "WAIT":
      // Wait step is handled by delay
      break;

    case "CONDITION":
      const passed = await evaluateCondition(contact, stepConfig);
      if (!passed) {
        // Skip to end or specific step
        const skipTo = (stepConfig.skipToStep as number) || automation.steps.length;
        await prisma.automationRun.update({
          where: { id: runId },
          data: { currentStep: skipTo },
        });
        // Queue the skip-to step
        if (skipTo < automation.steps.length) {
          await addAutomationJob({
            type: "automation-step",
            runId,
            automationId,
            contactId,
            stepIndex: skipTo,
          });
        } else {
          await completeAutomationRun(runId, automationId);
        }
        return { conditionFailed: true, skippedTo: skipTo };
      }
      break;

    case "UPDATE_CONTACT":
      await prisma.contact.update({
        where: { id: contactId },
        data: stepConfig.updates as Record<string, unknown>,
      });
      break;

    case "ADD_TO_LIST":
      if (stepConfig.listId) {
        await prisma.contactListMember.upsert({
          where: {
            contactId_listId: {
              contactId,
              listId: stepConfig.listId as string,
            },
          },
          create: {
            contactId,
            listId: stepConfig.listId as string,
          },
          update: {},
        });
      }
      break;

    case "REMOVE_FROM_LIST":
      if (stepConfig.listId) {
        await prisma.contactListMember.deleteMany({
          where: {
            contactId,
            listId: stepConfig.listId as string,
          },
        });
      }
      break;

    case "WEBHOOK":
      await callWebhook(stepConfig.url as string, {
        contact,
        automation: { id: automationId, name: automation.name },
        step: { index: stepIndex, type: step.stepType },
      });
      break;

    case "END":
      await completeAutomationRun(runId, automationId);
      return { completed: true };
  }

  // Move to next step
  const nextIndex = stepIndex + 1;
  if (nextIndex >= automation.steps.length) {
    await completeAutomationRun(runId, automationId);
    return { completed: true };
  }

  const nextStep = automation.steps[nextIndex];
  const delayMs = calculateDelayMs(nextStep.delayValue, nextStep.delayUnit);

  await prisma.automationRun.update({
    where: { id: runId },
    data: {
      currentStep: nextIndex,
      status: "WAITING",
      nextStepAt: new Date(Date.now() + delayMs),
    },
  });

  await addAutomationJob(
    {
      type: "automation-step",
      runId,
      automationId,
      contactId,
      stepIndex: nextIndex,
    },
    { delay: delayMs }
  );

  return { stepCompleted: stepIndex, nextStep: nextIndex };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateDelayMs(value: number, unit: string): number {
  switch (unit) {
    case "MINUTES":
      return value * 60 * 1000;
    case "HOURS":
      return value * 60 * 60 * 1000;
    case "DAYS":
      return value * 24 * 60 * 60 * 1000;
    case "WEEKS":
      return value * 7 * 24 * 60 * 60 * 1000;
    default:
      return value * 60 * 60 * 1000; // Default to hours
  }
}

async function completeAutomationRun(runId: string, automationId: string) {
  await prisma.automationRun.update({
    where: { id: runId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  await prisma.automation.update({
    where: { id: automationId },
    data: {
      totalCompleted: { increment: 1 },
      totalActive: { decrement: 1 },
    },
  });
}

async function processSendEmailStep(
  contact: { id: string; email: string; firstName: string | null; lastName: string | null; customFields: unknown },
  config: Record<string, unknown>,
  automationId: string
) {
  const trackingId = nanoid(16);

  const templateData = {
    contact: {
      email: contact.email,
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      ...((contact.customFields as Record<string, unknown>) || {}),
    },
    unsubscribeUrl: `${process.env.BASE_URL}/api/unsubscribe/${trackingId}`,
  };

  const html = compileTemplate(config.html as string, templateData);
  const subject = compileTemplate(config.subject as string, templateData);

  // Create a pseudo-campaign record for tracking
  await addEmailJob({
    type: "send-email",
    emailId: `automation-${automationId}-${contact.id}-${Date.now()}`,
    campaignId: `automation-${automationId}`,
    contactId: contact.id,
    to: contact.email,
    subject,
    html,
    fromName: (config.fromName as string) || process.env.DEFAULT_FROM_NAME || "Marketing",
    fromEmail: (config.fromEmail as string) || process.env.DEFAULT_FROM_EMAIL || "noreply@kiitconnect.com",
    trackingId,
  });
}

async function evaluateCondition(
  contact: { id: string; email: string; customFields: unknown; engagementScore: number },
  config: Record<string, unknown>
): Promise<boolean> {
  const field = config.field as string;
  const operator = config.operator as string;
  const value = config.value;

  let contactValue: unknown;
  if (field.startsWith("customFields.")) {
    const customField = field.replace("customFields.", "");
    contactValue = ((contact.customFields as Record<string, unknown>) || {})[customField];
  } else {
    contactValue = (contact as Record<string, unknown>)[field];
  }

  switch (operator) {
    case "equals":
      return contactValue === value;
    case "not_equals":
      return contactValue !== value;
    case "contains":
      return String(contactValue).includes(String(value));
    case "greater_than":
      return Number(contactValue) > Number(value);
    case "less_than":
      return Number(contactValue) < Number(value);
    case "is_set":
      return contactValue !== null && contactValue !== undefined;
    case "is_not_set":
      return contactValue === null || contactValue === undefined;
    default:
      return true;
  }
}

async function callWebhook(url: string, data: unknown) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error(`[AutomationWorker] Webhook call failed:`, error);
  }
}

export default createAutomationWorker;
