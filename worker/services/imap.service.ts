import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// IMAP IDLE Service
// Keeps a persistent connection open using the IMAP IDLE command so that new
// messages are pushed by the server (< 1 s latency) instead of being polled.
// Automatically reconnects with exponential back-off on any failure.
// ─────────────────────────────────────────────────────────────────────────────

const IMAP_HOST    = process.env.IMAP_HOST    || "mail.kiitconnect.com";
const IMAP_PORT    = parseInt(process.env.IMAP_PORT    || "993");
const IMAP_USER    = process.env.IMAP_USER    || process.env.SMTP_USER || "";
const IMAP_PASS    = process.env.IMAP_PASS    || process.env.SMTP_PASS || "";
const IMAP_SECURE  = IMAP_PORT === 993 || process.env.IMAP_SECURE === "true";
const MAX_BACKOFF  = 64_000; // 64 s

class ImapIdleService {
  private client: ImapFlow | null = null;
  private running  = false;
  private backoff  = 2_000;

  // ── Public API ─────────────────────────────────────────────────────────────

  start() {
    if (!IMAP_USER || !IMAP_PASS) {
      console.log(
        "[IMAP] ⚠  Skipping — set IMAP_USER + IMAP_PASS env vars to enable inbound mail"
      );
      return;
    }
    this.running = true;
    console.log(`[IMAP] Starting IDLE service → ${IMAP_HOST}:${IMAP_PORT} (secure=${IMAP_SECURE})`);
    // Fire-and-forget; errors are caught inside loop()
    this.loop().catch((e) => console.error("[IMAP] Fatal:", (e as Error).message));
  }

  async stop() {
    this.running = false;
    if (this.client) {
      try { await this.client.logout(); } catch { /* ignore */ }
      this.client = null;
    }
    console.log("[IMAP] Stopped");
  }

  // ── Core loop ──────────────────────────────────────────────────────────────

  private async loop() {
    while (this.running) {
      try {
        await this.connectAndIdle();
      } catch (err) {
        if (!this.running) break;
        console.error(`[IMAP] Error: ${(err as Error).message} — retrying in ${this.backoff / 1000}s`);
        await this.delay(this.backoff);
        this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF);
      }
    }
  }

  private async connectAndIdle() {
    this.client = new ImapFlow({
      host   : IMAP_HOST,
      port   : IMAP_PORT,
      secure : IMAP_SECURE,
      auth   : { user: IMAP_USER, pass: IMAP_PASS },
      logger : false,
      tls    : { rejectUnauthorized: false }, // tolerates self-signed certs
    });

    await this.client.connect();
    console.log(`[IMAP] ✓ Connected — back-off reset`);
    this.backoff = 2_000; // success → reset back-off

    const lock = await this.client.getMailboxLock("INBOX");
    try {
      // On first connect: sweep all messages from the last 30 days regardless
      // of Seen flag (catches emails read via webmail before worker started).
      // Deduplication by messageId prevents double-saves.
      await this.processRecent();

      // Hybrid approach: IDLE with periodic polling fallback
      // Some mail servers don't properly push IDLE notifications
      while (this.running) {
        // Poll for new messages every 30 seconds as a fallback
        const pollInterval = setInterval(async () => {
          if (this.running && this.client) {
            try {
              await this.processUnseen();
            } catch { /* ignore poll errors, IDLE will handle reconnect */ }
          }
        }, 30_000);

        try {
          // IDLE still used for instant notifications on servers that support it
          await this.client.idle();
        } finally {
          clearInterval(pollInterval);
        }
        
        if (!this.running) break;
        // On wakeup (either from IDLE notification or timeout) fetch UNSEEN
        await this.processUnseen();
      }
    } finally {
      lock.release();
    }

    if (this.running) await this.client.logout();
    this.client = null;
  }

  // ── Message processing ─────────────────────────────────────────────────────

  /** Initial sweep: all messages from the last 30 days (ignores Seen flag).
   *  Deduplication by messageId means already-saved emails are skipped safely. */
  private async processRecent() {
    if (!this.client) return;
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const uids = await this.client.search({ since }, { uid: true });
    if (uids.length === 0) { console.log("[IMAP] No recent messages on first sweep"); return; }
    console.log(`[IMAP] Initial sweep: ${uids.length} message(s) in the last 30 days`);
    await this.fetchAndSave(uids);
  }

  /** Wakeup fetch: only UNSEEN (new arrivals since last IDLE). */
  private async processUnseen() {
    if (!this.client) return;
    const uids = await this.client.search({ unseen: true }, { uid: true });
    if (uids.length === 0) return;
    console.log(`[IMAP] ${uids.length} unseen message(s) to process`);
    await this.fetchAndSave(uids);
  }

  private async fetchAndSave(uids: number[]) {
    if (!this.client || uids.length === 0) return;

    const toMark: string[] = [];

    // Fetch all messages first, THEN mark as Seen.
    // Calling messageFlagsAdd inside the fetch loop can interrupt the IMAP stream.
    for await (const msg of this.client.fetch(
      uids,
      { source: true, envelope: true },
      { uid: true }
    )) {
      const envMsgId = msg.envelope?.messageId;
      console.log(`[IMAP] Processing UID ${msg.uid}: "${msg.envelope?.subject}" msgId=${envMsgId}`);
      try {
        const saved = await this.saveMessage(msg.source, envMsgId);
        if (saved) toMark.push(msg.uid.toString());
      } catch (e) {
        console.error("[IMAP] Failed to save message UID", msg.uid, ":", (e as Error).message);
      }
    }

    // Batch-mark as Seen after the fetch loop completes
    if (toMark.length > 0 && this.client) {
      try {
        await this.client.messageFlagsAdd(toMark.join(","), ["\\Seen"], { uid: true });
      } catch {
        // Non-fatal: Seen flag is cosmetic — dedup by messageId is the real guard
      }
    }
  }

  private async saveMessage(source: Buffer, envelopeMessageId?: string): Promise<boolean> {
    const parsed = await simpleParser(source);
    const msgId  = parsed.messageId ?? envelopeMessageId ?? null;

    // Deduplication — messageId is unique in DB
    if (msgId) {
      const existing = await prisma.inboundEmail.findUnique({ where: { messageId: msgId } });
      if (existing) {
        console.log(`[IMAP] Skipped (duplicate): ${msgId}`);
        return false;
      }
    }

    const from = parsed.from?.value[0];
    const toRaw = parsed.to;
    const toAddr = Array.isArray(toRaw)
      ? toRaw[0]?.value[0]?.address
      : toRaw?.value[0]?.address;

    // Try to match sender to an existing contact
    const contact = from?.address
      ? await prisma.contact.findUnique({ where: { email: from.address } })
      : null;

    await prisma.inboundEmail.create({
      data: {
        messageId : msgId,
        subject   : parsed.subject || "(no subject)",
        fromEmail : from?.address || "unknown@unknown",
        fromName  : from?.name    || null,
        toEmail   : toAddr        ?? null,
        htmlBody  : typeof parsed.html === "string" ? parsed.html : null,
        textBody  : parsed.text ?? null,
        contactId : contact?.id ?? null,
        receivedAt: parsed.date   ?? new Date(),
      },
    });

    console.log(`[IMAP] ✓ Saved: "${parsed.subject}" from ${from?.address}`);
    return true;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}

export default new ImapIdleService();
