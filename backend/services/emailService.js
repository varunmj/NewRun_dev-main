const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Email assets configuration
const EMAIL_ASSETS_DIR = process.env.EMAIL_ASSETS_DIR || path.join(__dirname, '../email_assets');

function loadIcon(name) {
  const p = path.join(EMAIL_ASSETS_DIR, name);
  try {
    const buf = fs.readFileSync(p);
    console.log(`✓ loaded email asset ${name} (${buf.length} bytes)`);
    return buf;
  } catch (e) {
    console.warn(`✗ missing email asset ${name} at ${p}: ${e.message}`);
    return null;
  }
}

// Load social media icons at startup
const ICONS = {
  x: loadIcon('twitter.png'),
  linkedin: loadIcon('linkedin.png'),
  instagram: loadIcon('instagram.png'),
};

class EmailService {
  constructor() {
    this.transporter = null;
    // Delay initialization to ensure env vars are loaded
    setTimeout(() => {
      this.initializeTransporter();
    }, 100);
  }

  initializeTransporter() {
    try {
      console.log('🔧 Initializing email service...');
      console.log('📧 SMTP Host:', process.env.SES_SMTP_HOST);
      console.log('🔌 SMTP Port:', process.env.SES_SMTP_PORT);
      console.log('👤 SMTP Username:', process.env.SES_SMTP_USERNAME ? 'Set' : 'Not Set');
      console.log('🔑 SMTP Password:', process.env.SES_SMTP_PASSWORD ? 'Set' : 'Not Set');
      console.log('📨 From Email:', process.env.FROM_EMAIL);

      // Check if required environment variables are set
      if (!process.env.SES_SMTP_USERNAME || !process.env.SES_SMTP_PASSWORD) {
        console.warn('⚠️ Email service not configured - SMTP credentials missing');
        this.transporter = null;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SES_SMTP_HOST || 'email-smtp.us-east-2.amazonaws.com',
        port: process.env.SES_SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SES_SMTP_USERNAME,
          pass: process.env.SES_SMTP_PASSWORD
        },
        tls: {
          ciphers: 'SSLv3'
        }
      });

      console.log('✅ Email service initialized with SES SMTP');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  async sendEmail(to, subject, html, text = null, attachments = []) {
    try {
      console.log('📧 Attempting to send email...');
      console.log('📨 To:', to);
      console.log('📝 Subject:', subject);
      console.log('📤 From:', process.env.FROM_EMAIL || 'noreply@www.newrun.club');

      if (!this.transporter) {
        console.log('⚠️ Transporter not initialized, attempting to initialize...');
        this.initializeTransporter();
        if (!this.transporter) {
          throw new Error('Email transporter not initialized');
        }
      }

      const headers = {
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "List-Unsubscribe": `<${process.env.FRONTEND_URL || "https://www.newrun.club"}/email/unsubscribe?u={{uid}}>, <mailto:unsubscribe@www.newrun.club>`,
        "X-Auto-Response-Suppress": "All",
        "Auto-Submitted": "auto-generated",
      };

      const mailOptions = {
        from: `"NewRun" <${process.env.FROM_EMAIL || 'noreply@www.newrun.club'}>`,
        to: to,
        subject: subject,
        html: html,
        text: text || this.stripHtml(html),
        headers,
        replyTo: "support@www.newrun.club",
        attachments
      };

      console.log('📋 Mail options prepared, sending...');
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully!');
      console.log('📨 Message ID:', result.messageId);
      console.log('📊 Response:', result.response);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:');
      console.error('🔍 Error type:', error.name);
      console.error('📝 Error message:', error.message);
      console.error('🔧 Error code:', error.code);
      console.error('📋 Error response:', error.response);
      console.error('📚 Full error:', error);
      return { success: false, error: error.message, details: error };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // Helper method to get social media icon attachments
  getSocialMediaAttachments() {
    const atts = [];
    
    if (ICONS.x) {
      atts.push({ 
        filename: 'twitter.png', 
        content: ICONS.x, 
        cid: 'nr_x_32' 
      });
    }
    
    if (ICONS.linkedin) {
      atts.push({ 
        filename: 'linkedin.png', 
        content: ICONS.linkedin, 
        cid: 'nr_linkedin_32' 
      });
    }
    
    if (ICONS.instagram) {
      atts.push({ 
        filename: 'instagram.png', 
        content: ICONS.instagram, 
        cid: 'nr_instagram_32' 
      });
    }
    
    console.log('🖼  Inline attachments:', atts.map(a => `${a.cid}:${a.filename}`));
    return atts;
  }

  // Email Templates
  generateEmailVerificationTemplate(userName, verificationLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your NewRun Account</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 30px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .content h2 { color: #333; margin-bottom: 20px; font-size: 24px; }
          .content p { margin-bottom: 20px; font-size: 16px; color: #666; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .button:hover { opacity: 0.9; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
          .code { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; font-family: monospace; font-size: 18px; font-weight: bold; color: #333; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NewRun</h1>
            <p>Welcome to the future of student housing</p>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hi ${userName},</p>
            <p>Welcome to NewRun! We're excited to have you join our community of students finding their perfect housing solutions.</p>
            <p>To complete your account setup, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <div class="code">${verificationLink}</div>
            <p>This verification link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with NewRun, please ignore this email.</p>
            <p>Best regards,<br>The NewRun Team</p>
          </div>
          <div class="footer">
            <p>© 2024 NewRun. All rights reserved.</p>
            <p>This email was sent to you because you signed up for a NewRun account.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateOTPTemplate(userName, otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your NewRun OTP</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 30px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .content h2 { color: #333; margin-bottom: 20px; font-size: 24px; }
          .content p { margin-bottom: 20px; font-size: 16px; color: #666; }
          .otp-code { background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; font-family: monospace; font-size: 32px; font-weight: bold; color: #333; margin: 30px 0; border: 2px dashed #667eea; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 NewRun</h1>
            <p>Your One-Time Password</p>
          </div>
          <div class="content">
            <h2>Your OTP Code</h2>
            <p>Hi ${userName},</p>
            <p>You requested a one-time password for your NewRun account. Use the code below to complete your action:</p>
            <div class="otp-code">${otp}</div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This code will expire in 10 minutes</li>
              <li>Never share this code with anyone</li>
              <li>NewRun will never ask for your OTP via phone or email</li>
            </ul>
            <p>If you didn't request this OTP, please secure your account immediately.</p>
            <p>Best regards,<br>The NewRun Team</p>
          </div>
          <div class="footer">
            <p>© 2024 NewRun. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generatePasswordResetTemplate(userName, resetLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your NewRun Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 30px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .content h2 { color: #333; margin-bottom: 20px; font-size: 24px; }
          .content p { margin-bottom: 20px; font-size: 16px; color: #666; }
          .button { display: inline-block; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .button:hover { opacity: 0.9; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NewRun</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi ${userName},</p>
            <p>We received a request to reset your NewRun account password. If you made this request, click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this secure link into your browser:</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; font-family: monospace; word-break: break-all; margin: 20px 0;">${resetLink}</div>
            <div class="warning">
              <strong>Security Notice:</strong>
              <ul>
                <li>This secure link will expire in 15 minutes</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
                <li>This link can only be used once for security</li>
              </ul>
            </div>
            <p>If you didn't request a password reset, please secure your account and contact our support team.</p>
            <p>Best regards,<br>The NewRun Team</p>
          </div>
          <div class="footer">
            <p>© 2024 NewRun. All rights reserved.</p>
            <p>This email was sent because a password reset was requested for your account.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // --- Shared "Zoom-style" master layout ---
  renderNRLayout(opts) {
    const BRAND = {
      blue: "#0B5CFF",
      purple: "#9A67FB",
      textDark: "#10134A",
      bodyBg: "#F2F2F4",
      border: "#E5E7EB",
    };

    const preheader = opts.preheader || "";
    const siteHref = (opts.company && opts.company.siteHref) || "https://www.newrun.club";
    const phoneHref = (opts.company && opts.company.phoneHref) || "tel:+10000000000";
    const phoneText = (opts.company && opts.company.phoneText) || "+1 (000) 000-0000";
    const addressHtml = (opts.company && opts.company.addressHtml) || "NewRun Inc · Address goes here";

    // List-Unsubscribe headers are already set in sendEmail(); we mirror links in footer too.
    const listUnsubHref = opts.listUnsub?.link || siteHref + "/email/unsubscribe";

    const ctaColor = (opts.cta && opts.cta.color) || BRAND.blue;
    const ctaHref = (opts.cta && opts.cta.href) || siteHref;
    const ctaLabel = (opts.cta && opts.cta.label) || "Learn more";

    const wordmark = (opts.wordmark || "NewRun")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${wordmark}</title>
  <style>
    body{margin:0;padding:0;background:${BRAND.bodyBg};-webkit-text-size-adjust:none;-ms-text-size-adjust:none}
    table{border-collapse:collapse} img{border:0;-ms-interpolation-mode:bicubic;display:block}
    .outer{width:100%;max-width:720px} /* wider than 600 to avoid looking narrow */
    .rounded{border-radius:20px}
    a{color:${BRAND.blue};text-decoration:none}
    @media screen and (max-width:720px){.outer{max-width:100%}}
  </style>
</head>
<body style="background:${BRAND.bodyBg};margin:0">
  <!-- Preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;line-height:1px;color:transparent;">${preheader}</div>

  <table role="presentation" width="100%" bgcolor="${BRAND.bodyBg}" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:20px 12px">
      <table role="presentation" class="outer" cellpadding="0" cellspacing="0">
        <!-- Wordmark -->
        <tr>
          <td style="padding:0 0 16px 8px;font:700 30px/1.1 Inter,Arial,Helvetica,sans-serif;color:${BRAND.blue}">
            <a href="${siteHref}" style="display:inline-block;font:700 30px Inter,Arial,Helvetica,sans-serif;background:linear-gradient(90deg,#2563eb,#14b8a6);-webkit-background-clip:text;background-clip:text;color:transparent">
              ${wordmark}
            </a>
          </td>
        </tr>

        <!-- Hero -->
        ${opts.heroUrl ? `
        <tr>
          <td style="padding:0">
            <img class="rounded" src="${opts.heroUrl}" alt="" width="720" style="width:100%;max-width:720px;height:auto;border-radius:20px 20px 0 0"/>
          </td>
        </tr>` : ''}

        <!-- Card -->
        <tr>
          <td style="background:#fff;border-radius:${opts.heroUrl?'0 0 20px 20px':'20px'};border:1px solid ${BRAND.border};border-top:${opts.heroUrl?'0':'1px'};padding:30px 26px">
            <div style="font:600 32px/1.2 Montserrat,Arial,Helvetica,sans-serif;color:${BRAND.textDark};margin:0 0 10px">
              ${opts.headline || ""}
            </div>
            <div style="font:400 16px/24px Inter,Arial,Helvetica,sans-serif;color:#334155">
              ${opts.bodyHtml || ""}
            </div>

            <!-- CTA -->
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:18px 0 6px 0">
              <tr>
                <td align="left" bgcolor="${ctaColor}" style="border-radius:100px">
                  <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${ctaHref}" arcsize="50%" strokecolor="${ctaColor}" fillcolor="${ctaColor}" style="height:46px;v-text-anchor:middle;width:260px;">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:700;">${ctaLabel}</center>
                    </v:roundrect>
                  <![endif]-->
                  <a href="${ctaHref}" style="display:inline-block;padding:14px 30px;border-radius:100px;color:#fff;font:700 16px Arial,Helvetica,sans-serif;mso-hide:all">${ctaLabel}</a>
                </td>
              </tr>
            </table>

            ${opts.noteHtml || ""}
          </td>
        </tr>

        <!-- Spacer -->
        <tr><td style="height:16px;line-height:16px;font-size:16px">&nbsp;</td></tr>

        <!-- Social strip (blue band) -->
        <tr>
          <td style="background:${BRAND.blue};border-radius:16px;padding:12px 20px;color:#000">
            <table role="presentation" width="100%">
              <tr>
                <td style="font:700 16px Inter,Arial,Helvetica,sans-serif;color:#fff;vertical-align:middle">Connect with ${wordmark}</td>
                <td align="right" style="vertical-align:middle">
                  <div style="display:inline-flex;gap:28px;align-items:center">
                    ${opts.social?.x ? `<a href="${opts.social.x}" style="display:inline-block;transition:opacity 0.2s;background:white;border-radius:50%;padding:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1)"><img src="cid:nr_x_32" width="32" height="32" alt="X" style="display:block;border:0;outline:none;filter:brightness(0) invert(1)"></a>`:''}
                    ${opts.social?.linkedin ? `<a href="${opts.social.linkedin}" style="display:inline-block;transition:opacity 0.2s;background:white;border-radius:50%;padding:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1)"><img src="cid:nr_linkedin_32" width="32" height="32" alt="LinkedIn" style="display:block;border:0;outline:none;filter:brightness(0) invert(1)"></a>`:''}
                    ${opts.social?.instagram ? `<a href="${opts.social.instagram}" style="display:inline-block;transition:opacity 0.2s;background:white;border-radius:50%;padding:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1)"><img src="cid:nr_instagram_32" width="32" height="32" alt="Instagram" style="display:block;border:0;outline:none;filter:brightness(0) invert(1)"></a>`:''}
                    ${opts.social?.rss ? `<a href="${opts.social.rss}" style="display:inline-block;transition:opacity 0.2s;background:white;border-radius:50%;padding:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1)"><img src="cid:nr_rss_32" width="32" height="32" alt="Blog" style="display:block;border:0;outline:none;filter:brightness(0) invert(1)"></a>`:''}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr><td style="padding:16px 8px 30px 8px;text-align:center;color:#B6B6C2;font:400 13px/18px Inter,Arial,Helvetica,sans-serif">
          Visit <a href="${siteHref}" style="color:#94a3b8;text-decoration:underline">${siteHref.replace(/^https?:\/\//,'')}</a><br/>
          <a href="${phoneHref}" style="color:#94a3b8;text-decoration:none">${phoneText}</a><br/>
          ${addressHtml}<br/><br/>
          <span>&copy; ${new Date().getFullYear()} ${wordmark}. All rights reserved.</span><br/>
          <span style="display:block;margin-top:6px">
            Prefer fewer emails? <a href="${listUnsubHref}" style="color:#94a3b8;text-decoration:underline">Unsubscribe</a>
          </span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  generateWelcomeTemplate(userName) {
    const bodyHtml = `
      <p>Welcome to <strong>NewRun</strong>, ${userName}! You're in. Here's what you can do next:</p>
      <ul style="padding-left:18px;margin:0">
        <li><strong>Find housing</strong> near your campus</li>
        <li><strong>Browse marketplace</strong> deals from students</li>
        <li><strong>Match roommates</strong> with the vibe you want</li>
      </ul>
    `;

    return this.renderNRLayout({
      preheader: "Your NewRun account is ready",
      heroUrl: "https://www.newrun.club/assets/email/hero-welcome.png",
      headline: "Account activated",
      bodyHtml,
      cta: { label: "Open Dashboard", href: process.env.FRONTEND_URL || "https://www.newrun.club", color: "#0B5CFF" },
      social: { x:"https://x.com/newrunnnnn", linkedin:"https://linkedin.com/company/newrun-ed-ed", instagram:"https://instagram.com/newrun" },
      company: {
        siteHref: process.env.FRONTEND_URL || "https://www.newrun.club",
        phoneHref: "tel:+18885550123",
        phoneText: "+1 (888) 555-0123",
        addressHtml: "NewRun Inc · 123 Campus Drive · University City, CA 90210"
      },
      listUnsub: { link: (process.env.FRONTEND_URL || "https://www.newrun.club") + "/email/unsubscribe?u={{uid}}", oneClick:true }
    });
  }

  generateOTPVerificationTemplate(userName, code) {
    const bodyHtml = `
      <p>Hi ${userName},</p>
      <p>Use this 6-digit code to verify your email and unlock all features.</p>
      
      <!-- OTP Code Display -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 20px 0;">
        <tr><td align="center" style="padding:24px;border:2px solid #0B5CFF;border-radius:16px;background:#fff;box-shadow:0 6px 20px rgba(11,92,255,.15);">
          <div style="text-transform:uppercase;color:#64748b;font-size:12px;letter-spacing:1px;font-weight:700;margin-bottom:12px;">Verification Code</div>
          <div style="font-family:'Courier New',monospace;font-weight:800;font-size:48px;letter-spacing:12px;color:#111827;margin:8px 0;">${String(code)}</div>
          <div style="color:#6b7300;font-size:14px;margin-top:8px;">Enter this on NewRun to finish setup</div>
        </td></tr>
      </table>

      <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:12px;padding:16px 18px;margin:16px 0;font-size:14px;color:#92400e;">
        <strong>Security notice:</strong> the code expires in 10 minutes. Do not share it with anyone.
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0 0 0;border:1px solid #E5E7EB;border-radius:12px;background:linear-gradient(180deg,#F8FAFC, #F1F5F9);">
        <tr><td style="padding:20px 22px;">
          <div style="font-weight:700;color:#10134A;margin-bottom:8px;font-size:15px;">Next steps</div>
          <ol style="margin:0;color:#4b5563;padding-left:20px;font-size:14px;line-height:1.6">
            <li>Copy the code above</li>
            <li>Return to NewRun</li>
            <li>Paste it into "Verification code"</li>
            <li>Select <strong>Verify Email</strong></li>
          </ol>
        </td></tr>
      </table>

      <p style="margin:20px 0 0 0;color:#6b7300;font-size:14px;">Didn't sign up? You can safely ignore this email.</p>
    `;

    return this.renderNRLayout({
      preheader: "Verify your email to activate your NewRun account",
      heroUrl: "https://www.newrun.club/assets/email/nr-logo.png",
      headline: "Account Verification Required",
      bodyHtml,
      cta: { label: "Verify Email", href: process.env.FRONTEND_URL + "/verify-email" || "https://www.newrun.club/verify-email", color: "#0B5CFF" },
      social: { x:"https://x.com/newrunnn", linkedin:"https://linkedin.com/company/newrun-ed", instagram:"https://instagram.com/newrun" },
      company: {
        siteHref: process.env.FRONTEND_URL || "https://www.newrun.club",
        phoneHref: "tel:+18885550123",
        phoneText: "+1 (888) 555-0123",
        addressHtml: "NewRun Inc · 123 Campus Drive · University City, CA 90210"
      },
      listUnsub: { link: (process.env.FRONTEND_URL || "https://www.newrun.club") + "/email/unsubscribe?u={{uid}}", oneClick:true }
    });
  }

  generateEmailVerificationTemplate(userName, verificationLink) {
    const bodyHtml = `
      <p>Hi ${userName},</p>
      <p>Confirm your email to activate your NewRun account and unlock housing, marketplace, and roommate features.</p>
      <p style="margin:0">If the button doesn't work, paste this link into your browser:</p>
      <p style="word-break:break-all;color:#475569;font-size:13px;background:#f8fafc;padding:8px 12px;border-radius:6px;border:1px solid #e2e8f0;">${verificationLink}</p>
      <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:12px;padding:12px 14px;margin-top:12px;font-size:14px;color:#92400E">
        <strong>Security:</strong> link expires in 24 hours and can be used once.
      </div>
    `;

    return this.renderNRLayout({
      preheader: "Verify your email to activate NewRun",
      heroUrl: "https://www.newrun.club/assets/email/nr-logo.png",
      headline: "Verify your email",
      bodyHtml,
      cta: { label: "Verify Email", href: verificationLink, color: "#0B5CFF" },
      social: { x:"https://x.com/newrunnn", linkedin:"https://linkedin.com/company/newrun-ed", instagram:"https://instagram.com/newrun" },
      company: {
        siteHref: process.env.FRONTEND_URL || "https://www.newrun.club",
        phoneHref: "tel:+18885550123",
        phoneText: "+1 (888) 555-0123",
        addressHtml: "NewRun Inc · 123 Campus Drive · University City, CA 90210"
      },
      listUnsub: { link: (process.env.FRONTEND_URL || "https://www.newrun.club") + "/email/unsubscribe?u={{uid}}", oneClick:true }
    });
  }

  generatePasswordResetTemplate(userName, resetLink) {
    const bodyHtml = `
      <p>Hi ${userName},</p>
      <p>We received a request to reset your NewRun password. Click the button to continue.</p>
      <p style="margin:0">If the button doesn't work, paste this secure link:</p>
      <p style="word-break:break-all;color:#475569;font-size:13px;background:#f8fafc;padding:8px 12px;border-radius:6px;border:1px solid #e2e8f0;">${resetLink}</p>
      <div style="background:#FFF7ED;border:1px solid #FDBA74;border-radius:12px;padding:12px 14px;margin-top:12px;font-size:14px;color:#9A3412">
        <strong>Security:</strong> This link expires in 15 minutes and can be used once.
      </div>
    `;

    return this.renderNRLayout({
      preheader: "Reset your NewRun password",
      heroUrl: "https://www.newrun.club/assets/email/hero-reset.png",
      headline: "Reset your password",
      bodyHtml,
      cta: { label: "Reset Password", href: resetLink, color: "#9A67FB" },
      social: { x:"https://x.com/newrunnn", linkedin:"https://linkedin.com/company/newrun-ed", instagram:"https://instagram.com/newrun" },
      company: {
        siteHref: process.env.FRONTEND_URL || "https://www.newrun.club",
        phoneHref: "tel:+18885550123",
        phoneText: "+1 (888) 555-0123",
        addressHtml: "NewRun Inc · 123 Campus Drive · University City, CA 90210"
      },
      listUnsub: { link: (process.env.FRONTEND_URL || "https://www.newrun.club") + "/email/unsubscribe?u={{uid}}", oneClick:true }
    });
  }

  // Legacy method for backward compatibility
  generatePasswordResetTemplate_OLD(userName, resetLink) {
    const brandBlue = '#0B5CFF';
    const grayBg = '#F2F2F4';
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Verify your email</title>
      <style>
        body{margin:0;padding:0;background:${grayBg};-webkit-text-size-adjust:none;-ms-text-size-adjust:none}
        table{border-collapse:collapse} img{border:0;-ms-interpolation-mode:bicubic}
        a{color:${brandBlue};text-decoration:none}
        @media screen and (max-width:650px){.btn{padding:14px 22px!important;font-size:16px!important}}
      </style>
    </head>
    <body style="background:${grayBg}">
      <div style="display:none;font-size:1px;line-height:1px;max-height:0;opacity:0;overflow:hidden;">
        Verify your email to complete your NewRun account activation.
      </div>

      <table role="presentation" width="100%" bgcolor="${grayBg}">
        <tr><td align="center">
          <table role="presentation" width="100%" style="max-width:650px">
            <tr><td style="height:20px;line-height:20px;font-size:20px">&nbsp;</td></tr>

            <tr>
              <td align="left" style="padding:0 25px 20px 25px">
                <a href="${process.env.FRONTEND_URL || 'https://www.newrun.club'}"><img src="https://www.newrun.club/assets/nr-wordmark-blue.png" width="110" alt="NewRun"/></a>
              </td>
            </tr>

            <tr>
              <td style="padding:0 25px">
                <img src="https://www.newrun.club/assets/email/hero-link.png" width="650" alt="" style="width:100%;max-width:650px;border-radius:20px 20px 0 0;display:block"/>
              </td>
            </tr>

            <tr>
              <td style="padding:0 25px">
                <table role="presentation" width="100%" bgcolor="#ffffff" style="border-radius:0 0 20px 20px">
                  <tr>
                    <td style="padding:30px 30px 34px 30px;font-family:Arial,Helvetica,sans-serif;color:#10134A">
                      <div style="font-weight:700;font-size:30px;line-height:34px">Verify your email</div>
                      <div style="color:#334155;font-size:16px;line-height:24px;margin-top:6px">
                        Hi ${userName}, tap the button below to confirm your email and activate your NewRun account.
                      </div>

                      <table role="presentation" align="left" style="margin-top:18px">
                        <tr>
                          <td bgcolor="${brandBlue}" style="border-radius:100px">
                            <a class="btn" href="${verificationLink}" target="_blank"
                               style="display:inline-block;padding:16px 30px;font-family:Arial,Helvetica,sans-serif;color:#fff;font-weight:700;border-radius:100px">
                               Verify Email
                            </a>
                          </td>
                        </tr>
                      </table>

                      <div style="font-size:14px;color:#64748B;margin-top:24px">
                        Button not working? Paste this link in your browser:<br/>
                        <span style="word-break:break-all;color:#475569">${verificationLink}</span>
                      </div>

                      <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:12px;padding:12px 14px;margin-top:18px;font-size:14px;color:#92400E;font-weight:600">
                        Security notice: this link expires in 24 hours and can be used once.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Reuse social band + footer from the OTP template -->
            <tr><td style="padding:20px 25px 0 25px">
              <table role="presentation" width="100%" bgcolor="${brandBlue}" style="border-radius:20px">
                <tr>
                  <td align="left" style="padding:16px 22px;font-family:Arial,Helvetica,sans-serif;color:#fff;font-weight:700;font-size:20px">Connect with NewRun</td>
                  <td align="right" style="padding:12px 22px">
                    <a href="https://x.com/"><img src="https://www.newrun.club/assets/email/social-x.png" height="32" alt="X"/></a>
                    <a href="https://www.linkedin.com/"><img src="https://www.newrun.club/assets/email/social-linkedin.png" height="32" alt="LinkedIn" style="margin-left:8px"/></a>
                    <a href="https://www.instagram.com/"><img src="https://www.newrun.club/assets/email/social-instagram.png" height="32" alt="Instagram" style="margin-left:8px"/></a>
                    <a href="${process.env.FRONTEND_URL || 'https://www.newrun.club'}"><img src="https://www.newrun.club/assets/email/social-blog.png" height="32" alt="Blog" style="margin-left:8px"/></a>
                  </td>
                </tr>
              </table>
            </td></tr>

            <tr><td style="padding:16px 25px 30px 25px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:#B6B6C2">
              Visit <a href="https://www.newrun.club" style="color:#B6B6C2;text-decoration:underline">www.newrun.club</a><br/>
              <a href="tel:+1234567890" style="color:#B6B6C2;text-decoration:none">+1 (234) 567-890</a><br/>
              NewRun Inc · 123 Campus Drive · University City, CA 90210<br/><br/>
              &copy; ${new Date().getFullYear()} NewRun — All rights reserved.
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
  }

  generateDualVerificationTemplate(userName, verificationLink, verificationCode) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your NewRun Account</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
          .code-box { background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px; }
          .option { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #667eea; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Activated</h1>
            <p>Please verify your email address to complete your registration</p>
          </div>
          
          <div class="content">
            <h2>Hi ${userName}!</h2>
            <p>Thank you for joining NewRun! To complete your registration, please verify your email address using one of the methods below:</p>
            
            <div class="option">
              <h3>🔗 Method 1: Click the Link (Easiest)</h3>
              <p>Simply click the button below to verify your account instantly:</p>
              <a href="${verificationLink}" class="button">Verify My Account</a>
            </div>
            
            <div class="option">
              <h3>🔢 Method 2: Enter the Code (More Secure)</h3>
              <p>If you prefer to enter a verification code, use this 6-digit code:</p>
              <div class="code-box">
                <div class="code">${verificationCode}</div>
                <p style="margin: 10px 0 0 0; color: #666;">Enter this code on the NewRun website</p>
              </div>
            </div>
            
            <p><strong>Note:</strong> Both methods will expire in 24 hours. Choose whichever is more convenient for you!</p>
          </div>
          
          <div class="footer">
            <p>If you didn't create a NewRun account, you can safely ignore this email.</p>
            <p>© 2024 NewRun. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Convenience methods
  async sendEmailVerification(userEmail, userName, verificationLink) {
    const subject = 'Verify Your NewRun Account';
    const html = this.generateEmailVerificationTemplate(userName, verificationLink);
    const attachments = this.getSocialMediaAttachments();
    return await this.sendEmail(userEmail, subject, html, null, attachments);
  }

  async sendOTP(userEmail, userName, otp) {
    const subject = 'Account Verification Required - NewRun';
    const html = this.generateOTPVerificationTemplate(userName, otp);
    const attachments = this.getSocialMediaAttachments();
    return await this.sendEmail(userEmail, subject, html, null, attachments);
  }

  async sendPasswordReset(userEmail, userName, resetLink) {
    const subject = 'Reset Your NewRun Password';
    const html = this.generatePasswordResetTemplate(userName, resetLink);
    const attachments = this.getSocialMediaAttachments();
    return await this.sendEmail(userEmail, subject, html, null, attachments);
  }

  async sendWelcomeEmail(userEmail, userName) {
    const subject = 'Account Activated - NewRun';
    const html = this.generateWelcomeTemplate(userName);
    const attachments = this.getSocialMediaAttachments();
    return await this.sendEmail(userEmail, subject, html, null, attachments);
  }

  async sendEmailVerificationWithCode(userEmail, userName, verificationLink, verificationCode) {
    const subject = 'Account Verification Required - NewRun';
    const html = this.generateOTPVerificationTemplate(userName, verificationCode);
    const attachments = this.getSocialMediaAttachments();
    return await this.sendEmail(userEmail, subject, html, null, attachments);
  }

  generateOnboardingReminderTemplate(userName, currentStep, totalSteps, resumeLink, isFirstReminder = true) {
    const progressPercent = Math.round((currentStep / totalSteps) * 100);
    const stepText = isFirstReminder ? 'You\'re making great progress!' : 'Don\'t miss out on completing your setup!';
    
    const bodyHtml = `
      <p>Hi ${userName},</p>
      <p>${stepText} You've completed ${currentStep} of ${totalSteps} steps (${progressPercent}%) in your NewRun onboarding.</p>
      
      <div style="background:#F0F9FF;border:1px solid #0EA5E9;border-radius:12px;padding:16px 18px;margin:16px 0;font-size:14px;color:#0C4A6E">
        <strong>What's left:</strong> Complete your profile to unlock housing search, marketplace access, and roommate matching features.
      </div>

      <p style="margin:0">Ready to finish? Click below to pick up where you left off:</p>
    `;

    const ctaLabel = isFirstReminder ? 'Continue Setup' : 'Complete Profile';
    const ctaColor = isFirstReminder ? '#0B5CFF' : '#9A67FB';

    return this.renderNRLayout({
      preheader: `Complete your NewRun setup - ${progressPercent}% done`,
      heroUrl: "https://www.newrun.club/assets/email/hero-onboarding.png",
      headline: isFirstReminder ? "You're almost there!" : "Complete your profile",
      bodyHtml,
      cta: { label: ctaLabel, href: resumeLink, color: ctaColor },
      noteHtml: `
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:12px 14px;margin-top:16px;font-size:13px;color:#475569">
          <strong>Tip:</strong> Your progress is automatically saved, so you can continue anytime.
        </div>
      `,
      social: { x:"https://x.com/newrunnn", linkedin:"https://linkedin.com/company/newrun-ed", instagram:"https://instagram.com/newrun" },
      company: {
        siteHref: process.env.FRONTEND_URL || "https://www.newrun.club",
        phoneHref: "tel:+18885550123",
        phoneText: "+1 (888) 555-0123",
        addressHtml: "NewRun Inc · 123 Campus Drive · University City, CA 90210"
      },
      listUnsub: { link: (process.env.FRONTEND_URL || "https://www.newrun.club") + "/email/unsubscribe?u={{uid}}", oneClick:true }
    });
  }

  async sendOnboardingReminder(userEmail, userName, currentStep, totalSteps, resumeLink, isFirstReminder = true) {
    const subject = isFirstReminder 
      ? `Complete your NewRun setup - ${Math.round((currentStep / totalSteps) * 100)}% done`
      : 'Final reminder: Complete your NewRun profile';
    const html = this.generateOnboardingReminderTemplate(userName, currentStep, totalSteps, resumeLink, isFirstReminder);
    const attachments = this.getSocialMediaAttachments();
    return await this.sendEmail(userEmail, subject, html, null, attachments);
  }

  // Expose initialization method for manual reinitialization
  reinitialize() {
    this.initializeTransporter();
  }
}

module.exports = new EmailService();