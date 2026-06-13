import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { QUEUES, createRedisConnection, SendEmailJob } from "../queue";
import emailService from "../services/email.service";

const prisma = new PrismaClient();

// ============================================
// EMAIL WORKER
// Processes individual email send jobs
// ============================================

export function createEmailWorker() {
  const worker = new Worker<SendEmailJob>(
    QUEUES.EMAIL,
    async (job: Job<SendEmailJob>) => {
      const { emailId, campaignId, contactId, to, subject, html, text, fromName, fromEmail, replyTo, trackingId } =
        job.data;

      console.log(`[EmailWorker] Processing job ${job.id} - sending to ${to}`);

      // Update email status to SENDING
      await prisma.email.update({
        where: { id: emailId },
        data: { status: "SENDING" },
      });

      // Send the email
      const result = await emailService.send({
        to,
        subject,
        html,
        text,
        fromName,
        fromEmail,
        replyTo,
        trackingId,
        headers: {
          "X-Campaign-ID": campaignId,
          "X-Email-ID": emailId,
        },
      });

      if (result.success) {
        // Update email record
        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: "SENT",
            messageId: result.messageId,
            sentAt: result.timestamp,
          },
        });

        // Update contact stats
        await prisma.contact.update({
          where: { id: contactId },
          data: {
            emailsSent: { increment: 1 },
            lastEmailAt: result.timestamp,
          },
        });

        // Create sent event
        await prisma.emailEvent.create({
          data: {
            emailId,
            campaignId,
            contactId,
            type: "SENT",
            metadata: { messageId: result.messageId },
          },
        });

        // Update campaign stats and check completion
        const updatedCampaign = await prisma.campaign.update({
          where: { id: campaignId },
          data: { totalSent: { increment: 1 } },
        });

        // Flip campaign to SENT if all recipients have been sent to
        if (
          updatedCampaign.totalRecipients > 0 &&
          updatedCampaign.totalSent >= updatedCampaign.totalRecipients
        ) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: "SENT", sentAt: new Date() },
          });
          console.log(`[EmailWorker] Campaign ${campaignId} fully sent — marked SENT`);
        }

        console.log(`[EmailWorker] Successfully sent to ${to}, messageId: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
      } else {
        // Handle failure
        const retryCount = job.attemptsMade;
        
        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: retryCount >= 2 ? "FAILED" : "QUEUED",
            errorMessage: result.error,
            retryCount,
          },
        });

        console.error(`[EmailWorker] Failed to send to ${to}: ${result.error}`);
        throw new Error(result.error);
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 10, // Process 10 emails concurrently
      limiter: {
        max: 50, // Max 50 jobs per second
        duration: 1000,
      },
    }
  );

  worker.on("completed", (job) => {
    console.log(`[EmailWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[EmailWorker] Worker error:", err);
  });

  return worker;
}

export default createEmailWorker;
