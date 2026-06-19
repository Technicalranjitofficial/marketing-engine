import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import Handlebars from "handlebars";
import mjml2html from "mjml";
import { htmlToText } from "html-to-text";
import juice from "juice";

// ============================================
// EMAIL SERVICE
// Direct connection to Postfix SMTP server
// ============================================

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  trackingId: string;
  headers?: Record<string, string>;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isInitialized = false;
  private sendCount = 0;
  private lastResetTime = Date.now();

  // Rate limiting
  private rateLimit = parseInt(process.env.SMTP_RATE_LIMIT || "50"); // per second
  private dailyLimit = parseInt(process.env.SMTP_DAILY_LIMIT || "100000");
  private dailySent = 0;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const host = process.env.SMTP_HOST || "mail.kiitconnect.com";
    const port = parseInt(process.env.SMTP_PORT || "587");
    const secure = process.env.SMTP_SECURE === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    console.log(`[EmailService] Connecting to SMTP: ${host}:${port}`);

    // DKIM configuration (optional)
    const dkimPrivateKey = process.env.DKIM_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const dkimDomain = process.env.DKIM_DOMAIN || "kiitconnect.com";
    const dkimSelector = process.env.DKIM_SELECTOR || "mail";
    const dkim = dkimPrivateKey
      ? { domainName: dkimDomain, keySelector: dkimSelector, privateKey: dkimPrivateKey }
      : undefined;

    if (dkim) {
      console.log(`[EmailService] DKIM signing enabled: ${dkimSelector}._domainkey.${dkimDomain}`);
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
      dkim,
      // Connection pool for high performance
      pool: true,
      maxConnections: 10,
      maxMessages: 100,
      // Rate limiting at transport level
      rateDelta: 1000,
      rateLimit: this.rateLimit,
      // Timeouts
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
    });

    // Verify connection
    try {
      await this.transporter.verify();
      console.log("[EmailService] SMTP connection verified");
      this.isInitialized = true;
    } catch (error) {
      console.error("[EmailService] SMTP verification failed:", error);
      throw error;
    }
  }

  async send(payload: EmailPayload): Promise<SendResult> {
    if (!this.transporter || !this.isInitialized) {
      await this.initialize();
    }

    // Check daily limit
    this.resetDailyCountIfNeeded();
    if (this.dailySent >= this.dailyLimit) {
      return {
        success: false,
        error: "Daily send limit reached",
        timestamp: new Date(),
      };
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    // Inline <style> block CSS → keeps dark backgrounds intact after Gmail strips <head> CSS
    const inlinedHtml = juice(payload.html, {
      preserveMediaQueries: true,
      preserveImportant: true,
      removeStyleTags: false, // keep <style> for clients that support it (Apple Mail etc.)
      applyAttributesTableElements: true,
    });

    // Add tracking pixel
    const trackingPixel = `<img src="${baseUrl}/api/track/open/${payload.trackingId}" width="1" height="1" style="display:none;width:1px;height:1px;" alt="" />`;
    const htmlWithTracking = inlinedHtml.includes("</body>")
      ? inlinedHtml.replace("</body>", `${trackingPixel}</body>`)
      : inlinedHtml + trackingPixel;

    // Add link tracking
    const htmlWithLinks = this.addLinkTracking(htmlWithTracking, payload.trackingId, baseUrl);

    // Generate text version if not provided
    const textContent =
      payload.text ||
      htmlToText(payload.html, {
        wordwrap: 80,
        selectors: [
          { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
          { selector: "img", format: "skip" },
          { selector: "strong", format: "inline" },
          { selector: "b", format: "inline" },
          { selector: "em", format: "inline" },
          { selector: "i", format: "inline" },
          { selector: "h1", options: { uppercase: false } },
          { selector: "h2", options: { uppercase: false } },
          { selector: "h3", options: { uppercase: false } },
        ],
      });

    try {
      const result = await this.transporter!.sendMail({
        from: `"${payload.fromName}" <${payload.fromEmail}>`,
        to: payload.to,
        replyTo: payload.replyTo || payload.fromEmail,
        subject: payload.subject,
        html: htmlWithLinks,
        text: textContent,
        headers: {
          "X-Tracking-ID": payload.trackingId,
          "X-Campaign-ID": payload.headers?.["X-Campaign-ID"] || "",
          "List-Unsubscribe": `<${baseUrl}/api/unsubscribe/${payload.trackingId}>, <mailto:unsubscribe@kiitconnect.com?subject=Unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          ...payload.headers,
        },
      });

      this.dailySent++;
      this.sendCount++;

      return {
        success: true,
        messageId: result.messageId,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("[EmailService] Send error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }

  private addLinkTracking(html: string, trackingId: string, baseUrl: string): string {
    // Replace href links with tracked versions
    const linkRegex = /(<a\s+[^>]*href=["'])([^"']+)(["'][^>]*>)/gi;

    return html.replace(linkRegex, (match, before, url, after) => {
      // Skip mailto, tel, and unsubscribe links
      if (
        url.startsWith("mailto:") ||
        url.startsWith("tel:") ||
        url.includes("/unsubscribe") ||
        url.includes("/api/track")
      ) {
        return match;
      }

      const trackedUrl = `${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent(url)}`;
      return `${before}${trackedUrl}${after}`;
    });
  }

  private resetDailyCountIfNeeded(): void {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (now - this.lastResetTime >= oneDayMs) {
      this.dailySent = 0;
      this.lastResetTime = now;
      console.log("[EmailService] Daily send count reset");
    }
  }

  getStats() {
    return {
      isInitialized: this.isInitialized,
      sendCount: this.sendCount,
      dailySent: this.dailySent,
      dailyLimit: this.dailyLimit,
      rateLimit: this.rateLimit,
    };
  }

  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      this.isInitialized = false;
      console.log("[EmailService] Connection closed");
    }
  }
}

// Singleton instance
export const emailService = new EmailService();

// ============================================
// TEMPLATE UTILITIES
// ============================================

// Register Handlebars helpers
Handlebars.registerHelper("formatDate", (date: Date | string) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
});

Handlebars.registerHelper("uppercase", (str: string) => str?.toUpperCase());
Handlebars.registerHelper("lowercase", (str: string) => str?.toLowerCase());
Handlebars.registerHelper("capitalize", (str: string) => {
  return str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase();
});

export function compileTemplate(template: string, data: Record<string, unknown>): string {
  const compiled = Handlebars.compile(template);
  return compiled(data);
}

export function mjmlToHtml(mjmlContent: string): { html: string; errors: string[] } {
  const result = mjml2html(mjmlContent, {
    validationLevel: "soft",
    minify: true,
  });

  return {
    html: result.html,
    errors: result.errors.map((e) => e.message),
  };
}

// ============================================
// EMAIL VALIDATION
// ============================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function extractDomain(email: string): string {
  return email.split("@")[1] || "";
}

// Check if email domain has valid MX records (basic check)
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    "tempmail.com",
    "throwaway.email",
    "guerrillamail.com",
    "10minutemail.com",
    "mailinator.com",
    "temp-mail.org",
    "fakeinbox.com",
    "getnada.com",
  ];

  const domain = extractDomain(email).toLowerCase();
  return disposableDomains.includes(domain);
}

export default emailService;
