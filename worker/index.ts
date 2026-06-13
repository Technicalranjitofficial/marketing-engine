import { CronJob } from "cron";
import { redis, getAllQueueStats, addCleanupJob } from "./queue";
import createEmailWorker from "./processors/email.processor";
import createCampaignWorker from "./processors/campaign.processor";
import createAutomationWorker from "./processors/automation.processor";
import createAnalyticsWorker from "./processors/analytics.processor";
import emailService from "./services/email.service";

// ============================================
// MARKETING ENGINE WORKER
// Background job processor for email operations
// ============================================

console.log("═══════════════════════════════════════════════════════════");
console.log("  MARKETING ENGINE WORKER");
console.log("  High-performance email processing backend");
console.log("═══════════════════════════════════════════════════════════");

async function main() {
  console.log("\n[Worker] Starting initialization...\n");

  // Test Redis connection
  try {
    await redis.ping();
    console.log("[Worker] ✓ Redis connection established");
  } catch (error) {
    console.error("[Worker] ✗ Redis connection failed:", error);
    process.exit(1);
  }

  // Initialize email service
  try {
    await emailService.initialize();
    console.log("[Worker] ✓ Email service initialized");
    console.log(`[Worker]   SMTP Stats: ${JSON.stringify(emailService.getStats())}`);
  } catch (error) {
    console.error("[Worker] ✗ Email service initialization failed:", error);
    console.log("[Worker]   Continuing without email service - will retry on first send");
  }

  // Start workers
  console.log("\n[Worker] Starting queue processors...\n");

  const emailWorker = createEmailWorker();
  console.log("[Worker] ✓ Email worker started (concurrency: 10)");

  const campaignWorker = createCampaignWorker();
  console.log("[Worker] ✓ Campaign worker started (concurrency: 5)");

  const automationWorker = createAutomationWorker();
  console.log("[Worker] ✓ Automation worker started (concurrency: 10)");

  const analyticsWorker = createAnalyticsWorker();
  console.log("[Worker] ✓ Analytics worker started (concurrency: 20)");

  // Schedule cleanup jobs
  const cleanupJob = new CronJob(
    "0 3 * * *", // Every day at 3 AM
    async () => {
      console.log("[Worker] Running scheduled cleanup...");
      await addCleanupJob({ type: "cleanup", task: "expired-tokens" });
      await addCleanupJob({ type: "cleanup", task: "old-logs" });
      await addCleanupJob({ type: "cleanup", task: "stale-jobs" });
    },
    null,
    true,
    "UTC"
  );

  console.log("[Worker] ✓ Cleanup cron scheduled (daily at 3 AM UTC)");

  // Log queue stats periodically
  const statsInterval = setInterval(async () => {
    try {
      const stats = await getAllQueueStats();
      const summary = stats.map((s) => `${s.name}: ${s.waiting}w/${s.active}a/${s.completed}c`).join(" | ");
      console.log(`[Worker] Queue stats: ${summary}`);
    } catch {
      // Ignore stats errors
    }
  }, 60000); // Every minute

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Worker is running and processing jobs");
  console.log("  Press Ctrl+C to stop");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Worker] Received ${signal}, shutting down gracefully...`);

    clearInterval(statsInterval);
    cleanupJob.stop();

    await Promise.all([
      emailWorker.close(),
      campaignWorker.close(),
      automationWorker.close(),
      analyticsWorker.close(),
    ]);

    await emailService.close();
    await redis.quit();

    console.log("[Worker] Shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("[Worker] Fatal error:", error);
  process.exit(1);
});
