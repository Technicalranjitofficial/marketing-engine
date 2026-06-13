// ============================================================
// KIIT CONNECT v3 — PHOSPHOR EMAIL TEMPLATES
// Design system: #050A15 bg · #06D6FF cyan · #9333EA violet
// Fonts: Space Grotesk (body) · Bebas Neue unavailable in email → system fallback
// All templates support {{firstName}}, {{lastName}}, {{email}}
// {{unsubscribeUrl}} is auto-injected by the email service
// ============================================================

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  previewText: string;
  thumbnail: string;
  html: (vars?: Record<string, string>) => string;
}

// ─── Shared base ─────────────────────────────────────────────

const base = (body: string, accentColor = "#06D6FF") => `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="dark"/>
<meta name="supported-color-schemes" content="dark"/>
<title>KIIT Connect</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0 !important;
    padding: 0 !important;
    background-color: #050A15 !important;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  table { border-collapse: collapse !important; }
  @media (prefers-color-scheme: dark) {
    body, table { background-color: #050A15 !important; }
  }
</style>
</head>
<body bgcolor="#050A15" style="margin:0;padding:0;background-color:#050A15 !important;font-family:'Segoe UI',system-ui,-apple-system,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#050A15" style="background-color:#050A15 !important;">
<tr><td align="center" style="padding:40px 16px;background-color:#050A15;">

<!-- Container -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#080E1E" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;border:1px solid rgba(6,214,255,0.15);background-color:#080E1E !important;">

<!-- Top accent bar -->
<tr><td style="height:3px;background:linear-gradient(90deg,#06D6FF,#9333EA,#06D6FF);"></td></tr>

${body}

<!-- Footer -->
<tr>
  <td style="padding:32px 30px;background-color:#050A15 !important;border-top:1px solid rgba(6,214,255,0.10);" bgcolor="#050A15">
    <!-- Logo row -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:16px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:28px;height:28px;background:rgba(6,214,255,0.08);border:1px solid rgba(6,214,255,0.35);border-radius:7px;text-align:center;vertical-align:middle;">
                <span style="color:#06D6FF;font-size:12px;font-weight:900;letter-spacing:-0.5px;">KC</span>
              </td>
              <td style="padding-left:8px;color:#06D6FF;font-size:14px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">KIIT CONNECT</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center">
          <p style="margin:0 0 6px;color:#7AAFC8;font-size:12px;">The #1 student platform for KIIT University</p>
          <p style="margin:0 0 16px;color:#4A6580;font-size:11px;">
            <a href="https://kiitconnect.com/academic" style="color:#4A6580;text-decoration:none;">Academic</a> &nbsp;·&nbsp;
            <a href="https://kiitconnect.com/calculator" style="color:#4A6580;text-decoration:none;">SGPA</a> &nbsp;·&nbsp;
            <a href="https://kiitconnect.com/ai/chatbot" style="color:#4A6580;text-decoration:none;">AI Chatbot</a> &nbsp;·&nbsp;
            <a href="https://kiitconnect.com/blogs" style="color:#4A6580;text-decoration:none;">Blogs</a>
          </p>
          <p style="margin:0;color:#4A6580;font-size:11px;">
            You're receiving this because you're part of KIIT Connect.
            &nbsp;<a href="{{unsubscribeUrl}}" style="color:#06D6FF;text-decoration:underline;opacity:0.6;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>

</table>
<!-- /Container -->

</td></tr>
</table>
</body>
</html>`;

// ─── Shared CTA button ────────────────────────────────────────

const ctaBtn = (url: string, text: string, color = "#06D6FF") =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
      <td style="border-radius:8px;background:${color};box-shadow:0 0 20px rgba(6,214,255,0.35);">
        <a href="${url}" style="display:inline-block;padding:14px 32px;color:#050A15;font-size:14px;font-weight:800;text-decoration:none;letter-spacing:0.5px;border-radius:8px;">${text}</a>
      </td>
    </tr>
  </table>`;

// ─── Template 1: Welcome / Onboarding ────────────────────────

export const welcomeTemplate: EmailTemplate = {
  id: "welcome",
  name: "Welcome to KIIT Connect",
  description: "Warm onboarding email for new KIITians joining the platform",
  category: "Onboarding",
  previewText: "Welcome aboard, KIITian! Your journey starts here.",
  thumbnail: "🎓",
  html: (v = {}) => base(`
<tr>
  <td style="padding:48px 30px 36px;text-align:center;background:linear-gradient(135deg,rgba(6,214,255,0.06) 0%,rgba(147,51,234,0.06) 100%);">
    <div style="display:inline-block;width:64px;height:64px;background:rgba(6,214,255,0.1);border:1px solid rgba(6,214,255,0.4);border-radius:16px;line-height:64px;font-size:32px;margin-bottom:20px;">🎓</div>
    <h1 style="margin:0 0 8px;color:#C8DCF0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Welcome, ${v.firstName || "KIITian"}!</h1>
    <p style="margin:0;color:#7AAFC8;font-size:16px;">You're now part of KIIT's #1 student platform.</p>
  </td>
</tr>
<tr>
  <td style="padding:32px 30px;">
    <p style="margin:0 0 24px;color:#A8C8E0;font-size:15px;line-height:1.7;">
      Hey <strong style="color:#C8DCF0;">${v.firstName || "there"}</strong>,<br/><br/>
      We're excited to have you on KIIT Connect! You now have access to free PYQs, class notes, the SGPA calculator, faculty reviews, AI chatbot, and a growing community of KIITians.
    </p>

    <!-- Feature grid -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td width="48%" style="padding:16px;background:rgba(6,214,255,0.05);border:1px solid rgba(6,214,255,0.12);border-radius:10px;vertical-align:top;">
          <div style="font-size:22px;margin-bottom:8px;">📚</div>
          <div style="color:#06D6FF;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Free Resources</div>
          <div style="color:#7AAFC8;font-size:13px;">PYQs, notes, books — all free, forever.</div>
        </td>
        <td width="4%"></td>
        <td width="48%" style="padding:16px;background:rgba(147,51,234,0.05);border:1px solid rgba(147,51,234,0.15);border-radius:10px;vertical-align:top;">
          <div style="font-size:22px;margin-bottom:8px;">🤖</div>
          <div style="color:#9333EA;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">AI Chatbot</div>
          <div style="color:#7AAFC8;font-size:13px;">KIIT-specific AI to answer all your questions.</div>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td width="48%" style="padding:16px;background:rgba(20,184,166,0.05);border:1px solid rgba(20,184,166,0.15);border-radius:10px;vertical-align:top;">
          <div style="font-size:22px;margin-bottom:8px;">🔢</div>
          <div style="color:#14B8A6;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">SGPA Calculator</div>
          <div style="color:#7AAFC8;font-size:13px;">Calculate your SGPA &amp; CGPA instantly.</div>
        </td>
        <td width="4%"></td>
        <td width="48%" style="padding:16px;background:rgba(245,158,11,0.05);border:1px solid rgba(245,158,11,0.15);border-radius:10px;vertical-align:top;">
          <div style="font-size:22px;margin-bottom:8px;">🏫</div>
          <div style="color:#F59E0B;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Section Swap</div>
          <div style="color:#7AAFC8;font-size:13px;">Swap your section with fellow KIITians easily.</div>
        </td>
      </tr>
    </table>

    <div style="text-align:center;">
      ${ctaBtn(v.ctaUrl || "https://kiitconnect.com/get-started", v.ctaText || "Explore KIIT Connect →")}
    </div>
  </td>
</tr>
`),
};

// ─── Template 2: Premium / Pro Invite ────────────────────────

export const premiumTemplate: EmailTemplate = {
  id: "premium-invite",
  name: "Premium / Pro Invite",
  description: "Exclusive invite or upgrade prompt with Phosphor violet glow",
  category: "Marketing",
  previewText: "You've been selected for something special.",
  thumbnail: "⚡",
  html: (v = {}) => base(`
<tr>
  <td style="padding:48px 30px 36px;text-align:center;background:linear-gradient(135deg,rgba(147,51,234,0.12) 0%,rgba(6,214,255,0.06) 100%);">
    <div style="display:inline-block;width:64px;height:64px;background:rgba(147,51,234,0.15);border:1px solid rgba(147,51,234,0.5);border-radius:16px;line-height:64px;font-size:32px;margin-bottom:20px;">⚡</div>
    <div style="display:inline-block;padding:4px 14px;background:rgba(147,51,234,0.15);border:1px solid rgba(147,51,234,0.4);border-radius:20px;color:#9333EA;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;">Exclusive Invite</div>
    <h1 style="margin:0 0 8px;color:#C8DCF0;font-size:26px;font-weight:800;">${v.headline || "You've Been Selected"}</h1>
    <p style="margin:0;color:#7AAFC8;font-size:15px;">Special access reserved for ${v.firstName || "you"}.</p>
  </td>
</tr>
<tr>
  <td style="padding:32px 30px;">
    <p style="margin:0 0 20px;color:#A8C8E0;font-size:15px;line-height:1.7;">
      Hi <strong style="color:#C8DCF0;">${v.firstName || "there"}</strong>,<br/><br/>
      We've handpicked a select group of KIITians for early access to something we've been building for a while. You're on that list.
    </p>

    <!-- Highlight box -->
    <div style="background:rgba(147,51,234,0.07);border:1px solid rgba(147,51,234,0.25);border-left:3px solid #9333EA;border-radius:10px;padding:20px;margin-bottom:28px;">
      <div style="color:#9333EA;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">What you get</div>
      <ul style="margin:0;padding-left:20px;color:#A8C8E0;font-size:14px;line-height:2;">
        <li>Priority access to new features</li>
        <li>Ad-free experience across the platform</li>
        <li>Exclusive community badge</li>
        <li>Direct feedback channel to the team</li>
      </ul>
    </div>

    <div style="text-align:center;">
      ${ctaBtn(v.ctaUrl || "https://kiitconnect.com", v.ctaText || "Claim Your Access →", "#9333EA")}
    </div>
    <p style="text-align:center;margin:16px 0 0;color:#4A6580;font-size:12px;">This invite expires in 48 hours.</p>
  </td>
</tr>
`),
};

// ─── Template 3: Newsletter ───────────────────────────────────

export const newsletterTemplate: EmailTemplate = {
  id: "newsletter",
  name: "KIITian Weekly",
  description: "Weekly digest newsletter for KIIT Connect community",
  category: "Newsletter",
  previewText: "This week on KIIT Connect — resources, updates & more.",
  thumbnail: "📡",
  html: (v = {}) => base(`
<tr>
  <td style="padding:36px 30px 24px;background:rgba(6,214,255,0.03);">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <div style="color:#06D6FF;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">KIITian Weekly</div>
          <h1 style="margin:0;color:#C8DCF0;font-size:24px;font-weight:800;">${v.headline || "What's New on KIIT Connect"}</h1>
        </td>
        <td width="60" align="right" style="font-size:36px;">📡</td>
      </tr>
    </table>
    <div style="height:1px;background:linear-gradient(90deg,#06D6FF,transparent);margin-top:16px;opacity:0.3;"></div>
  </td>
</tr>
<tr>
  <td style="padding:24px 30px 32px;">
    <p style="margin:0 0 24px;color:#A8C8E0;font-size:15px;line-height:1.7;">
      Hey ${v.firstName || "KIITian"} 👋<br/><br/>
      Here's your weekly roundup of everything happening on KIIT Connect.
    </p>

    <!-- Story 1 -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;background:rgba(6,214,255,0.04);border:1px solid rgba(6,214,255,0.10);border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:18px 20px;">
          <div style="color:#06D6FF;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">📚 Resources Update</div>
          <div style="color:#C8DCF0;font-size:14px;font-weight:600;margin-bottom:6px;">100+ New PYQs Added This Week</div>
          <div style="color:#7AAFC8;font-size:13px;line-height:1.6;">Semester 5 &amp; 6 PYQs across all branches are now available — completely free.</div>
        </td>
      </tr>
    </table>

    <!-- Story 2 -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;background:rgba(147,51,234,0.04);border:1px solid rgba(147,51,234,0.12);border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:18px 20px;">
          <div style="color:#9333EA;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">🤖 AI Feature</div>
          <div style="color:#C8DCF0;font-size:14px;font-weight:600;margin-bottom:6px;">AI Chatbot Now Supports KIIT Syllabus Q&amp;A</div>
          <div style="color:#7AAFC8;font-size:13px;line-height:1.6;">Ask anything about your syllabus and get instant, accurate answers from our KIIT-trained AI.</div>
        </td>
      </tr>
    </table>

    <!-- Story 3 -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background:rgba(20,184,166,0.04);border:1px solid rgba(20,184,166,0.12);border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:18px 20px;">
          <div style="color:#14B8A6;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">🏛 Community</div>
          <div style="color:#C8DCF0;font-size:14px;font-weight:600;margin-bottom:6px;">Join 50,000+ KIITians on the Platform</div>
          <div style="color:#7AAFC8;font-size:13px;line-height:1.6;">The community keeps growing. Invite your batchmates and unlock more features together.</div>
        </td>
      </tr>
    </table>

    <div style="text-align:center;">
      ${ctaBtn(v.ctaUrl || "https://kiitconnect.com", v.ctaText || "Read More on KIIT Connect →")}
    </div>
  </td>
</tr>
`),
};

// ─── Template 4: Promo / Offer ────────────────────────────────

export const promoTemplate: EmailTemplate = {
  id: "promo",
  name: "Limited Offer",
  description: "Urgency-driven promotional email with cyan/violet split",
  category: "Promotional",
  previewText: "Limited time — don't miss this.",
  thumbnail: "🎯",
  html: (v = {}) => base(`
<tr>
  <td style="background:linear-gradient(135deg,rgba(6,214,255,0.10),rgba(147,51,234,0.10));padding:48px 30px;text-align:center;">
    <div style="display:inline-block;padding:6px 16px;background:rgba(6,214,255,0.12);border:1px solid rgba(6,214,255,0.4);border-radius:20px;color:#06D6FF;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:20px;">⚡ Limited Time</div>
    <h1 style="margin:0 0 12px;color:#C8DCF0;font-size:32px;font-weight:900;letter-spacing:-1px;">${v.headline || "Special Offer for KIITians"}</h1>
    <p style="margin:0;color:#7AAFC8;font-size:16px;">Exclusively for ${v.firstName || "KIIT Connect"} members.</p>
  </td>
</tr>
<tr>
  <td style="padding:32px 30px;">
    <p style="margin:0 0 24px;color:#A8C8E0;font-size:15px;line-height:1.7;">
      Hey <strong style="color:#C8DCF0;">${v.firstName || "KIITian"}</strong>,<br/><br/>
      We've been working on something special, and you get first access. This offer is only available to a limited number of students — and you're one of them.
    </p>

    <!-- Offer box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="padding:28px;background:rgba(6,214,255,0.05);border:1px solid rgba(6,214,255,0.20);border-radius:12px;text-align:center;box-shadow:0 0 40px rgba(6,214,255,0.05);">
          <div style="color:#7AAFC8;font-size:13px;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Offer details</div>
          <div style="color:#06D6FF;font-size:36px;font-weight:900;margin:8px 0;">${v.offerText || "FREE Premium Access"}</div>
          <div style="color:#A8C8E0;font-size:13px;">${v.offerSubtext || "No credit card required. Just your KIIT email."}</div>
        </td>
      </tr>
    </table>

    <div style="text-align:center;margin-bottom:12px;">
      ${ctaBtn(v.ctaUrl || "https://kiitconnect.com", v.ctaText || "Claim This Offer →")}
    </div>
    <p style="text-align:center;margin:0;color:#4A6580;font-size:12px;">⏱ Offer ends soon. Don't wait.</p>
  </td>
</tr>
`),
};

// ─── Template 5: Re-engagement ────────────────────────────────

export const reengagementTemplate: EmailTemplate = {
  id: "reengagement",
  name: "We Miss You",
  description: "Win-back email for inactive KIIT Connect users",
  category: "Retention",
  previewText: "It's been a while, KIITian. Come back.",
  thumbnail: "🔁",
  html: (v = {}) => base(`
<tr>
  <td style="padding:48px 30px 32px;text-align:center;">
    <div style="font-size:52px;margin-bottom:16px;">🔁</div>
    <h1 style="margin:0 0 8px;color:#C8DCF0;font-size:26px;font-weight:800;">We Miss You, ${v.firstName || "KIITian"}</h1>
    <p style="margin:0;color:#7AAFC8;font-size:15px;">KIIT Connect has changed. A lot.</p>
  </td>
</tr>
<tr>
  <td style="padding:0 30px 32px;">
    <p style="margin:0 0 24px;color:#A8C8E0;font-size:15px;line-height:1.7;">
      We noticed you haven't visited in a while. Since you left, we've added a ton of new features and resources just for KIITians like you.
    </p>

    <!-- What's new list -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background:rgba(6,214,255,0.03);border:1px solid rgba(6,214,255,0.10);border-radius:12px;">
      <tr><td style="padding:20px 24px;">
        <div style="color:#06D6FF;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">What's new since you left</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${["🤖 AI Chatbot trained on KIIT syllabus",
             "📊 Live placement stats & alumni data",
             "🔁 Section swap with real students",
             "📚 500+ new PYQs across all semesters",
             "🌐 Faculty reviews & contact directory"].map(item =>
            `<tr><td style="padding:6px 0;color:#A8C8E0;font-size:14px;border-bottom:1px solid rgba(6,214,255,0.06);">${item}</td></tr>`
          ).join("")}
        </table>
      </td></tr>
    </table>

    <div style="text-align:center;">
      ${ctaBtn(v.ctaUrl || "https://kiitconnect.com", v.ctaText || "Come Back →")}
    </div>
  </td>
</tr>
`),
};

// ─── Template 6: Event Invite ─────────────────────────────────

export const eventTemplate: EmailTemplate = {
  id: "event-invite",
  name: "Event Invite",
  description: "Campus event / webinar invite with teal accent",
  category: "Events",
  previewText: "You're invited — reserve your spot now.",
  thumbnail: "🎪",
  html: (v = {}) => base(`
<tr>
  <td style="padding:48px 30px 32px;text-align:center;background:linear-gradient(135deg,rgba(20,184,166,0.08),rgba(6,214,255,0.05));">
    <div style="display:inline-block;padding:6px 16px;background:rgba(20,184,166,0.12);border:1px solid rgba(20,184,166,0.4);border-radius:20px;color:#14B8A6;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:20px;">You're Invited</div>
    <h1 style="margin:0 0 8px;color:#C8DCF0;font-size:26px;font-weight:800;">${v.headline || "KIIT Connect Community Event"}</h1>
    <p style="margin:0;color:#7AAFC8;font-size:15px;">Reserve your spot before it fills up.</p>
  </td>
</tr>
<tr>
  <td style="padding:32px 30px;">
    <p style="margin:0 0 24px;color:#A8C8E0;font-size:15px;line-height:1.7;">
      Hey <strong style="color:#C8DCF0;">${v.firstName || "KIITian"}</strong>,<br/><br/>
      We're hosting an exclusive event for the KIIT Connect community. Spots are limited and we'd love to see you there.
    </p>

    <!-- Event details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td width="48%" style="padding:18px;background:rgba(20,184,166,0.05);border:1px solid rgba(20,184,166,0.15);border-radius:10px;text-align:center;vertical-align:top;">
          <div style="color:#14B8A6;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">📅 Date</div>
          <div style="color:#C8DCF0;font-size:15px;font-weight:700;">${v.eventDate || "Coming Soon"}</div>
        </td>
        <td width="4%"></td>
        <td width="48%" style="padding:18px;background:rgba(20,184,166,0.05);border:1px solid rgba(20,184,166,0.15);border-radius:10px;text-align:center;vertical-align:top;">
          <div style="color:#14B8A6;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">📍 Where</div>
          <div style="color:#C8DCF0;font-size:15px;font-weight:700;">${v.eventLocation || "Online / KIIT Campus"}</div>
        </td>
      </tr>
    </table>

    <div style="text-align:center;">
      ${ctaBtn(v.ctaUrl || "https://kiitconnect.com", v.ctaText || "Reserve My Spot →", "#14B8A6")}
    </div>
  </td>
</tr>
`),
};

// ─── Template 7: Transactional ────────────────────────────────

export const transactionalTemplate: EmailTemplate = {
  id: "transactional",
  name: "Account / OTP Notification",
  description: "Clean transactional email for OTP, confirmations, and alerts",
  category: "Transactional",
  previewText: "Action required on your KIIT Connect account.",
  thumbnail: "🔐",
  html: (v = {}) => base(`
<tr>
  <td style="padding:40px 30px;text-align:center;">
    <div style="display:inline-block;width:60px;height:60px;background:rgba(6,214,255,0.08);border:1px solid rgba(6,214,255,0.3);border-radius:14px;line-height:60px;font-size:28px;margin-bottom:20px;">🔐</div>
    <h1 style="margin:0 0 8px;color:#C8DCF0;font-size:22px;font-weight:800;">${v.headline || "Account Notification"}</h1>
    <p style="margin:0;color:#7AAFC8;font-size:14px;">KIIT Connect Security</p>
  </td>
</tr>
<tr>
  <td style="padding:0 30px 32px;">
    <p style="margin:0 0 20px;color:#A8C8E0;font-size:15px;line-height:1.7;">
      Hi <strong style="color:#C8DCF0;">${v.firstName || "there"}</strong>,<br/><br/>
      ${v.message || "A security action was requested on your KIIT Connect account. Use the code below to proceed."}
    </p>

    <!-- OTP / Code box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:24px;background:rgba(6,214,255,0.06);border:1px solid rgba(6,214,255,0.25);border-radius:12px;text-align:center;">
          <div style="color:#7AAFC8;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Your Code</div>
          <div style="color:#06D6FF;font-size:36px;font-weight:900;letter-spacing:8px;font-family:'Courier New',monospace;">${v.otpCode || "------"}</div>
          <div style="color:#4A6580;font-size:12px;margin-top:8px;">Expires in 10 minutes</div>
        </td>
      </tr>
    </table>

    <!-- Security notice -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:14px 16px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-left:3px solid #F59E0B;border-radius:8px;">
          <p style="margin:0;color:#A8C8E0;font-size:13px;line-height:1.6;">⚠️ If you did not request this, please ignore this email. Your account remains secure.</p>
        </td>
      </tr>
    </table>

    <div style="text-align:center;">
      ${ctaBtn(v.ctaUrl || "https://kiitconnect.com", v.ctaText || "Go to KIIT Connect")}
    </div>
  </td>
</tr>
`),
};

// ─── Template 8: Product / Feature Launch ────────────────────

export const launchTemplate: EmailTemplate = {
  id: "product-launch",
  name: "Feature Launch",
  description: "Bold feature announcement with the full Phosphor gradient treatment",
  category: "Marketing",
  previewText: "Something new just dropped on KIIT Connect.",
  thumbnail: "🚀",
  html: (v = {}) => base(`
<tr>
  <td style="padding:0;">
    <!-- Hero with full gradient -->
    <div style="background:linear-gradient(135deg,#050A15 0%,#0D0A25 40%,#080E1E 100%);padding:52px 30px;text-align:center;position:relative;">
      <!-- Glow orbs (simulated via borders) -->
      <div style="display:inline-block;padding:6px 16px;background:rgba(6,214,255,0.1);border:1px solid rgba(6,214,255,0.35);border-radius:20px;color:#06D6FF;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:20px;">🚀 New Feature</div>
      <h1 style="margin:0 0 12px;color:#C8DCF0;font-size:30px;font-weight:900;letter-spacing:-0.5px;line-height:1.2;">${v.headline || "Something New Just Launched"}</h1>
      <p style="margin:0;color:#7AAFC8;font-size:16px;max-width:400px;margin-left:auto;margin-right:auto;">${v.subheadline || "Built for KIITians. Ready for you."}</p>
    </div>
  </td>
</tr>
<tr>
  <td style="padding:32px 30px;">
    <p style="margin:0 0 24px;color:#A8C8E0;font-size:15px;line-height:1.7;">
      Hey <strong style="color:#C8DCF0;">${v.firstName || "KIITian"}</strong>,<br/><br/>
      We've been quietly building something new and it's finally here. This is one of the most requested features from the community — and we think you're going to love it.
    </p>

    <!-- Feature highlight -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:20px 24px;background:linear-gradient(135deg,rgba(6,214,255,0.06),rgba(147,51,234,0.06));border:1px solid rgba(6,214,255,0.15);border-radius:12px;">
          <div style="color:#06D6FF;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">✨ Highlights</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${["Fast, intuitive, and built for KIIT",
               "Completely free for all students",
               "Works on mobile and desktop",
               "Your feedback shaped this feature"].map(item =>
              `<tr><td style="padding:5px 0;color:#A8C8E0;font-size:14px;">
                <span style="color:#06D6FF;margin-right:8px;">→</span>${item}
              </td></tr>`
            ).join("")}
          </table>
        </td>
      </tr>
    </table>

    <div style="text-align:center;margin-top:28px;">
      ${ctaBtn(v.ctaUrl || "https://kiitconnect.com", v.ctaText || "Try It Now →")}
    </div>
  </td>
</tr>
`),
};

// ─── Exports ──────────────────────────────────────────────────

export const ALL_TEMPLATES: EmailTemplate[] = [
  welcomeTemplate,
  premiumTemplate,
  newsletterTemplate,
  promoTemplate,
  reengagementTemplate,
  eventTemplate,
  transactionalTemplate,
  launchTemplate,
];

export function getTemplateById(id: string): EmailTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}

export function renderTemplate(id: string, vars: Record<string, string> = {}): string {
  const t = getTemplateById(id);
  if (!t) throw new Error(`Template "${id}" not found`);
  let html = t.html(vars);
  // Safety net: strip any remaining unreplaced {{var}} placeholders
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key === "unsubscribeUrl") return "#";
    return "";
  });
  return html;
}
