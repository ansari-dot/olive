import { processEmailOutbox } from "../services/emailService.js";
import { invalidateCache } from "../middlewares/cache.js";
import Deal from "../models/Deal.js";

let timer = null;
let isRunning = false;

/**
 * Single execution cycle for background operational tasks.
 */
async function runBackgroundCycle() {
  if (isRunning) return;
  isRunning = true;

  try {
    // 1. Process & Retry Pending/Failed Outbox Emails
    try {
      const emailResult = await processEmailOutbox(15);
      if (emailResult && emailResult.processed > 0) {
        console.log(`[BackgroundSupervisor] Drained ${emailResult.processed} emails from outbox`);
      }
    } catch (err) {
      console.error("[BackgroundSupervisor] Email outbox error:", err.message);
    }

    // 2. Reconcile Expired Deals
    try {
      const now = new Date();
      // Find deals that just expired in the last window to bust caches
      const expiredCount = await Deal.countDocuments({
        isActive: true,
        endsAt: { $lt: now },
      });
      if (expiredCount > 0) {
        invalidateCache("/api/deals");
        invalidateCache("/api/products");
      }
    } catch (err) {
      console.error("[BackgroundSupervisor] Deal reconciliation error:", err.message);
    }
  } catch (err) {
    console.error("[BackgroundSupervisor] Unexpected error in background worker cycle:", err.message);
  } finally {
    isRunning = false;
  }
}

/**
 * Starts the in-process background task supervisor.
 * Runs every 60 seconds.
 */
export function startBackgroundSupervisor(intervalMs = 60_000) {
  if (timer) return;
  console.log(`[BackgroundSupervisor] Initialized background worker daemon (interval: ${intervalMs / 1000}s)`);

  // Run initial cycle shortly after startup (after 5 seconds)
  setTimeout(() => {
    runBackgroundCycle().catch(() => {});
  }, 5_000);

  timer = setInterval(() => {
    runBackgroundCycle().catch(() => {});
  }, intervalMs);

  // Unref so the supervisor does not block process exit during tests or scripts
  if (timer.unref) {
    timer.unref();
  }
}

/**
 * Stops the supervisor cleanly for graceful shutdowns.
 */
export function stopBackgroundSupervisor() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log("[BackgroundSupervisor] Stopped background worker daemon cleanly");
  }
}
