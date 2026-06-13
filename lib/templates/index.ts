// ============================================================
// BEAUTIFUL EMAIL TEMPLATES LIBRARY
// All templates support {{firstName}}, {{lastName}}, {{email}}
// {{unsubscribeUrl}} is auto-injected by the email service
// ============================================================

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  previewText: string;
  thumbnail: string; // emoji for preview
  html: (vars?: Record<string, string>) => string;
}

// ─── Shared helpers ───────────────────────────────────────────

const base = (body: string, footerExtra = "") => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Email</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
${body}
<!-- Footer -->
<tr><td style="padding:32px 30px;text-align:center;border-top:1px solid #1e1e1e;">
${footerExtra}
<p style="margin:0 0 8px;color:#555;font-size:13px;">You're receiving this because you subscribed.</p>
<p style="margin:0;color:#444;font-size:12px;"><a href="{{unsubscribeUrl}}" style="color:#666;text-decoration:underline;">Unsubscribe</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

// ─── Template 1: Welcome / Onboarding ────────────────────────

export const welcomeTemplate: EmailTemplate = {
  id: "welcome",
  name: "Welcome Email",
  description: "Warm onboarding email for new subscribers",
  category: "Onboarding",
  previewText: "Welcome aboard! We're thrilled to have you.",
  thumbnail: "👋",
  html: (v = {}) => base(`
<tr>
  <td style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:16px 16px 0 0;padding:50px 30px;text-align:center;">
    <div style="width:72px;height:72px;background:rgba(255,255,255,.15);border-radius:50%;margin:0 auto 20px;line-height:72px;font-size:36px;">👋</div>
    <h1 style="margin:0;color:#fff;font-size:30px;font-weight:700;letter-spacing:-0.5px;">Welcome, ${v.firstName || "{{firstName}}"}!</h1>
    <p style="margin:12px 0 0;color:rgba(255,255,255,.85);font-size:16px;">We're thrilled to have you on board.</p>
  </td>
</tr>
<tr>
  <td style="background:#161616;padding:40px 30px;">
    <p style="margin:0 0 20px;color:#ccc;font-size:16px;line-height:1.7;">
      Hey <strong style="color:#fff;">${v.firstName || "{{firstName}}"}</strong>,<br/><br/>
      Thank you for joining us! You're now part of a growing community. We're here to help you get the most out of your experience.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#1a1a2e;border-radius:12px;padding:20px;margin-bottom:12px;">
          <table role="presentation" width="100%"><tr>
            <td width="40" style="font-size:24px;">📚</td>
            <td style="color:#ddd;font-size:14px;padding-left:12px;"><strong style="color:#fff;">Explore Resources</strong><br/>Browse our library of guides and tutorials.</td>
          </tr></table>
        </td>
      </tr>
      <tr><td height="10"></td></tr>
      <tr>
        <td style="background:#1a1a2e;border-radius:12px;padding:20px;">
          <table role="presentation" width="100%"><tr>
            <td width="40" style="font-size:24px;">🚀</td>
            <td style="color:#ddd;font-size:14px;padding-left:12px;"><strong style="color:#fff;">Get Started</strong><br/>Complete your profile and unlock full features.</td>
          </tr></table>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:30px;">
      <tr><td align="center">
        <a href="${v.ctaUrl || "#"}" style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;padding:14px 48px;border-radius:50px;font-size:16px;font-weight:600;box-shadow:0 8px 24px rgba(102,126,234,.4);">${v.ctaText || "Get Started →"}</a>
      </td></tr>
    </table>
  </td>
</tr>`)
};

// ─── Template 2: Premium Invitation (KIIT Connect style) ──────

export const premiumTemplate: EmailTemplate = {
  id: "premium-invite",
  name: "Premium Invitation",
  description: "Exclusive upgrade invitation with benefits",
  category: "Marketing",
  previewText: "You're invited to something special 👑",
  thumbnail: "👑",
  html: (v = {}) => base(`
<tr>
  <td style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:16px 16px 0 0;padding:50px 30px;text-align:center;">
    <div style="width:80px;height:80px;background:rgba(255,255,255,.2);border-radius:50%;margin:0 auto 20px;line-height:80px;font-size:42px;">👑</div>
    <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">You're Invited to Premium</h1>
    <p style="margin:10px 0 0;color:rgba(255,255,255,.9);font-size:16px;">Exclusive access just for you</p>
  </td>
</tr>
<tr>
  <td style="background:#161616;padding:40px 30px;">
    <h2 style="margin:0 0 15px;color:#fff;font-size:22px;">Hey ${v.firstName || "{{firstName}}"}! 👋</h2>
    <p style="margin:0 0 24px;color:#bbb;font-size:15px;line-height:1.7;">
      We've selected you for exclusive Premium access. Here's what you unlock:
    </p>
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:14px;padding:24px;">
      ${["📚 Unlimited access to all content","🎯 AI-powered tools & solutions","⚡ Priority support (response in minutes)","🚀 Early access to new features"].map(f => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;"><tr>
        <td width="32" style="font-size:18px;">${f.substring(0,2)}</td>
        <td style="color:#ddd;font-size:14px;padding-left:10px;">${f.substring(3)}</td>
      </tr></table>`).join("")}
    </div>
    <div style="background:#1a1a2e;border:1px solid #2d2d5e;border-radius:12px;padding:16px 20px;margin-top:20px;text-align:center;">
      <p style="margin:0;color:#a78bfa;font-size:14px;font-weight:600;">🎁 LIMITED TIME: Get 30% OFF Your First Month</p>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr><td align="center">
        <a href="${v.ctaUrl || "#"}" style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;padding:16px 52px;border-radius:50px;font-size:17px;font-weight:600;box-shadow:0 8px 25px rgba(102,126,234,.4);">Upgrade to Premium →</a>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;text-align:center;color:#555;font-size:12px;">No credit card required · Cancel anytime</p>
  </td>
</tr>`)
};

// ─── Template 3: Newsletter ───────────────────────────────────

export const newsletterTemplate: EmailTemplate = {
  id: "newsletter",
  name: "Monthly Newsletter",
  description: "Clean newsletter with articles and updates",
  category: "Newsletter",
  previewText: "Your monthly digest is here!",
  thumbnail: "📰",
  html: (v = {}) => base(`
<tr>
  <td style="background:#161616;border-radius:16px 16px 0 0;padding:30px;border-bottom:3px solid #667eea;">
    <table role="presentation" width="100%"><tr>
      <td><span style="color:#667eea;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">MONTHLY DIGEST</span></td>
      <td align="right"><span style="color:#555;font-size:13px;">${v.date || new Date().toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span></td>
    </tr></table>
    <h1 style="margin:16px 0 0;color:#fff;font-size:26px;font-weight:700;">${v.headline || "What's New This Month"}</h1>
  </td>
</tr>
<tr>
  <td style="background:#111;padding:30px;">
    <p style="margin:0 0 24px;color:#bbb;font-size:15px;line-height:1.7;">
      Hi ${v.firstName || "{{firstName}}"}, here's your curated update for this month.
    </p>
    ${[
      {emoji:"🔥",title:v.article1Title||"Featured Story",desc:v.article1Desc||"Your most important story or announcement goes here. Keep it short and compelling."},
      {emoji:"💡",title:v.article2Title||"Tip of the Month",desc:v.article2Desc||"Share a useful tip, trick, or insight your audience will appreciate."},
      {emoji:"📊",title:v.article3Title||"By the Numbers",desc:v.article3Desc||"Share a key metric or stat that demonstrates value."},
    ].map(a => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;background:#161616;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:20px;">
          <table role="presentation" width="100%"><tr>
            <td width="40" style="font-size:24px;vertical-align:top;padding-top:2px;">${a.emoji}</td>
            <td style="padding-left:14px;">
              <p style="margin:0 0 6px;color:#fff;font-size:15px;font-weight:600;">${a.title}</p>
              <p style="margin:0;color:#999;font-size:13px;line-height:1.6;">${a.desc}</p>
            </td>
          </tr></table>
        </td>
      </tr>
    </table>`).join("")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td align="center">
        <a href="${v.ctaUrl||"#"}" style="display:inline-block;background:#667eea;color:#fff;text-decoration:none;padding:13px 42px;border-radius:8px;font-size:15px;font-weight:600;">${v.ctaText||"Read Full Issue →"}</a>
      </td></tr>
    </table>
  </td>
</tr>`)
};

// ─── Template 4: Flash Sale / Promo ───────────────────────────

export const promoTemplate: EmailTemplate = {
  id: "promo",
  name: "Flash Sale / Promo",
  description: "High-impact sales email with countdown feel",
  category: "Promotional",
  previewText: "⚡ Limited time offer — don't miss this!",
  thumbnail: "⚡",
  html: (v = {}) => base(`
<tr>
  <td style="background:linear-gradient(135deg,#f093fb,#f5576c);border-radius:16px 16px 0 0;padding:50px 30px;text-align:center;">
    <p style="margin:0 0 10px;background:rgba(255,255,255,.2);display:inline-block;padding:6px 18px;border-radius:50px;color:#fff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Limited Time Offer</p>
    <h1 style="margin:16px 0 8px;color:#fff;font-size:42px;font-weight:800;">${v.discount||"30% OFF"}</h1>
    <p style="margin:0;color:rgba(255,255,255,.9);font-size:18px;">${v.offerLine||"Everything. Today Only."}</p>
  </td>
</tr>
<tr>
  <td style="background:#161616;padding:40px 30px;">
    <p style="margin:0 0 20px;color:#ccc;font-size:15px;line-height:1.7;text-align:center;">
      Hey ${v.firstName||"{{firstName}}"}, this deal is too good to miss.
    </p>
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:14px;padding:24px;margin-bottom:24px;">
      ${(v.items||"Premium Plan\nAll Features\nPriority Support").split("\n").map(item => `
      <table role="presentation" width="100%" style="margin-bottom:10px;"><tr>
        <td width="24"><div style="width:8px;height:8px;background:#f5576c;border-radius:50%;margin-top:4px;"></div></td>
        <td style="color:#ddd;font-size:14px;">${item}</td>
        <td align="right" style="color:#10b981;font-size:13px;font-weight:600;">✓ Included</td>
      </tr></table>`).join("")}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${v.ctaUrl||"#"}" style="display:inline-block;background:linear-gradient(135deg,#f093fb,#f5576c);color:#fff;text-decoration:none;padding:16px 56px;border-radius:50px;font-size:17px;font-weight:700;box-shadow:0 8px 24px rgba(245,87,108,.4);">${v.ctaText||"Claim Your Discount →"}</a>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;text-align:center;color:#555;font-size:12px;">Offer expires at midnight · Use code <strong style="color:#f5576c;">${v.code||"SAVE30"}</strong></p>
  </td>
</tr>`)
};

// ─── Template 5: Re-engagement ────────────────────────────────

export const reengagementTemplate: EmailTemplate = {
  id: "reengagement",
  name: "We Miss You",
  description: "Win-back inactive subscribers",
  category: "Retention",
  previewText: "We haven't seen you in a while...",
  thumbnail: "💔",
  html: (v = {}) => base(`
<tr>
  <td style="background:#161616;border-radius:16px 16px 0 0;padding:50px 30px;text-align:center;">
    <div style="font-size:56px;margin-bottom:16px;">💔</div>
    <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">We Miss You, ${v.firstName||"{{firstName}}"}.</h1>
    <p style="margin:12px 0 0;color:#888;font-size:15px;">It's been a while since we last connected.</p>
  </td>
</tr>
<tr>
  <td style="background:#111;padding:40px 30px;">
    <p style="margin:0 0 24px;color:#bbb;font-size:15px;line-height:1.7;text-align:center;">
      A lot has changed since you were last here. Here's what you've been missing:
    </p>
    ${[
      {emoji:"✨",text: v.update1||"New features and improvements you'll love"},
      {emoji:"🎁",text: v.update2||"Exclusive deals only for returning members"},
      {emoji:"🤝",text: v.update3||"A community that's grown and gotten better"},
    ].map(u => `
    <div style="background:#161616;border-left:3px solid #667eea;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:10px;">
      <span style="font-size:18px;">${u.emoji}</span>
      <span style="color:#ccc;font-size:14px;margin-left:10px;">${u.text}</span>
    </div>`).join("")}
    <div style="background:#1a1a2e;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <p style="margin:0;color:#a78bfa;font-size:15px;font-weight:600;">🎁 Come back and get <strong>${v.offer||"1 month free"}</strong></p>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-right:8px;">
          <a href="${v.ctaUrl||"#"}" style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">${v.ctaText||"Come Back →"}</a>
        </td>
        <td align="center" style="padding-left:8px;">
          <a href="{{unsubscribeUrl}}" style="display:inline-block;background:#1e1e1e;color:#666;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:14px;border:1px solid #333;">Unsubscribe</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`)
};

// ─── Template 6: Event Invite ─────────────────────────────────

export const eventTemplate: EmailTemplate = {
  id: "event-invite",
  name: "Event Invitation",
  description: "Webinar, workshop or live event invite",
  category: "Events",
  previewText: "You're invited! Reserve your spot now.",
  thumbnail: "🎉",
  html: (v = {}) => base(`
<tr>
  <td style="background:linear-gradient(135deg,#0f2027,#203a43,#2c5364);border-radius:16px 16px 0 0;padding:50px 30px;text-align:center;">
    <p style="margin:0 0 8px;color:#38bdf8;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">You're Invited</p>
    <h1 style="margin:0 0 12px;color:#fff;font-size:28px;font-weight:700;">${v.eventName||"Live Workshop: Level Up Your Skills"}</h1>
    <div style="display:inline-flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:16px;">
      <span style="background:rgba(255,255,255,.1);color:#fff;padding:8px 18px;border-radius:20px;font-size:13px;">📅 ${v.date||"Saturday, June 15"}</span>
      <span style="background:rgba(255,255,255,.1);color:#fff;padding:8px 18px;border-radius:20px;font-size:13px;">⏰ ${v.time||"2:00 PM IST"}</span>
      <span style="background:rgba(255,255,255,.1);color:#fff;padding:8px 18px;border-radius:20px;font-size:13px;">📍 ${v.location||"Online / Zoom"}</span>
    </div>
  </td>
</tr>
<tr>
  <td style="background:#161616;padding:40px 30px;">
    <p style="margin:0 0 20px;color:#bbb;font-size:15px;line-height:1.7;">
      Hey ${v.firstName||"{{firstName}}"}, we'd love to see you there! Here's what you'll get:
    </p>
    ${(v.agenda||"Introduction & Overview\nHands-on demonstrations\nLive Q&A session\nExclusive resources for attendees").split("\n").map((item,i) => `
    <table role="presentation" width="100%" style="margin-bottom:8px;"><tr>
      <td width="32" style="color:#38bdf8;font-size:13px;font-weight:700;">0${i+1}</td>
      <td style="color:#ddd;font-size:14px;border-left:1px solid #1e3a4a;padding-left:14px;">${item}</td>
    </tr></table>`).join("")}
    <div style="background:#0c1929;border:1px solid #1e3a4a;border-radius:12px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;color:#38bdf8;font-size:14px;">🎟 Limited seats available — reserve yours now.</p>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${v.ctaUrl||"#"}" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#38bdf8);color:#fff;text-decoration:none;padding:15px 50px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 8px 24px rgba(14,165,233,.3);">${v.ctaText||"Reserve My Spot →"}</a>
      </td></tr>
    </table>
  </td>
</tr>`)
};

// ─── Template 7: Transactional / Account ─────────────────────

export const transactionalTemplate: EmailTemplate = {
  id: "transactional",
  name: "Account Update",
  description: "Clean transactional / confirmation email",
  category: "Transactional",
  previewText: "Important update to your account.",
  thumbnail: "🔐",
  html: (v = {}) => base(`
<tr>
  <td style="background:#161616;border-radius:16px 16px 0 0;padding:40px 30px;">
    <table role="presentation" width="100%"><tr>
      <td><div style="width:48px;height:48px;background:#1a1a2e;border-radius:12px;line-height:48px;text-align:center;font-size:24px;">🔐</div></td>
      <td style="padding-left:16px;">
        <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${v.brand||"Your Platform"}</p>
        <h2 style="margin:4px 0 0;color:#fff;font-size:18px;font-weight:600;">${v.title||"Account Notification"}</h2>
      </td>
    </tr></table>
  </td>
</tr>
<tr>
  <td style="background:#111;padding:30px;">
    <p style="margin:0 0 20px;color:#bbb;font-size:15px;line-height:1.7;">
      Hi ${v.firstName||"{{firstName}}"},<br/><br/>
      ${v.message||"We wanted to let you know about an important update to your account. Please review the details below."}
    </p>
    ${v.details ? `
    <div style="background:#161616;border-radius:10px;padding:20px;margin:20px 0;">
      ${v.details.split("\n").map(d => {
        const [label,val] = d.split(":");
        return `<table role="presentation" width="100%" style="margin-bottom:10px;"><tr>
          <td style="color:#666;font-size:13px;width:40%;">${label}</td>
          <td style="color:#ddd;font-size:13px;text-align:right;">${val||""}</td>
        </tr></table>`;
      }).join("")}
    </div>` : `
    <div style="background:#161616;border-radius:10px;padding:20px;margin:20px 0;">
      <table role="presentation" width="100%" style="margin-bottom:10px;"><tr>
        <td style="color:#666;font-size:13px;">Status</td>
        <td style="color:#10b981;font-size:13px;font-weight:600;text-align:right;">✓ Active</td>
      </tr></table>
      <table role="presentation" width="100%" style="margin-bottom:10px;"><tr>
        <td style="color:#666;font-size:13px;">Email</td>
        <td style="color:#ddd;font-size:13px;text-align:right;">{{email}}</td>
      </tr></table>
      <table role="presentation" width="100%"><tr>
        <td style="color:#666;font-size:13px;">Date</td>
        <td style="color:#ddd;font-size:13px;text-align:right;">${new Date().toLocaleDateString()}</td>
      </tr></table>
    </div>`}
    ${v.ctaUrl ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td align="center">
        <a href="${v.ctaUrl}" style="display:inline-block;background:#667eea;color:#fff;text-decoration:none;padding:13px 40px;border-radius:8px;font-size:15px;font-weight:600;">${v.ctaText||"View Account →"}</a>
      </td></tr>
    </table>` : ""}
    <p style="margin:20px 0 0;color:#555;font-size:12px;">If you didn't request this change, please contact support immediately.</p>
  </td>
</tr>`)
};

// ─── Template 8: Product Launch ───────────────────────────────

export const launchTemplate: EmailTemplate = {
  id: "product-launch",
  name: "Product Launch",
  description: "Announce a new product, feature or update",
  category: "Marketing",
  previewText: "Introducing something you've been waiting for 🚀",
  thumbnail: "🚀",
  html: (v = {}) => base(`
<tr>
  <td style="background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);border-radius:16px 16px 0 0;padding:60px 30px;text-align:center;">
    <p style="margin:0 0 12px;color:#a78bfa;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:3px;">Introducing</p>
    <h1 style="margin:0 0 16px;color:#fff;font-size:36px;font-weight:800;line-height:1.2;">${v.productName||"Something Amazing"}</h1>
    <p style="margin:0;color:rgba(255,255,255,.7);font-size:17px;max-width:400px;margin:0 auto;">${v.tagline||"The product you've been waiting for is finally here."}</p>
    <div style="margin-top:30px;font-size:72px;">${v.emoji||"🚀"}</div>
  </td>
</tr>
<tr>
  <td style="background:#161616;padding:40px 30px;">
    <p style="margin:0 0 24px;color:#bbb;font-size:15px;line-height:1.7;text-align:center;">
      Hey ${v.firstName||"{{firstName}}"}, ${v.intro||"we've been working on this for months and we're so excited to finally share it with you."}
    </p>
    <div style="display:grid;gap:12px;">
      ${(v.features||"⚡ Blazing fast performance\n🎯 Built for power users\n🔒 Enterprise-grade security\n🌈 Beautiful, intuitive design").split("\n").map(f => `
      <div style="background:#1a1a2e;border-radius:10px;padding:16px 20px;border:1px solid #2d2d5e;">
        <span style="color:#fff;font-size:14px;">${f}</span>
      </div>`).join("")}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
      <tr><td align="center">
        <a href="${v.ctaUrl||"#"}" style="display:inline-block;background:linear-gradient(135deg,#a78bfa,#8b5cf6);color:#fff;text-decoration:none;padding:16px 56px;border-radius:50px;font-size:17px;font-weight:700;box-shadow:0 8px 24px rgba(139,92,246,.4);">${v.ctaText||"Try It Now →"}</a>
      </td></tr>
    </table>
  </td>
</tr>`)
};

// ─── Export all ───────────────────────────────────────────────

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
  // Safety net: replace any remaining unreplaced {{var}} placeholders
  // so literal template tags never reach the recipient's inbox
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key === "unsubscribeUrl") return "#"; // fallback: anchor only
    return ""; // strip unknown vars
  });
  return html;
}
