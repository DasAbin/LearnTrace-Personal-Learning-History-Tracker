import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import logger from '../lib/logger';

// ── Transport setup ───────────────────────────────────────────────────
// Priority: SendGrid (HTTP API) > SMTP (nodemailer) > Console fallback

const SENDGRID_CONFIGURED = !!process.env.SENDGRID_API_KEY;
const SMTP_CONFIGURED = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

let transport: 'sendgrid' | 'smtp' | 'console' = 'console';
let smtpTransporter: nodemailer.Transporter | null = null;

if (SENDGRID_CONFIGURED) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  transport = 'sendgrid';
  logger.info('✅ SendGrid configured — emails will be sent via SendGrid HTTP API.');
} else if (SMTP_CONFIGURED) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 5000,
  });
  transport = 'smtp';

  // Verify SMTP connection in background (non-blocking)
  smtpTransporter.verify()
    .then(() => logger.info('✅ SMTP connected — email sending is active.'))
    .catch((error) => logger.info({ error }, '⚠️ SMTP verify failed — will still attempt to send.'));
} else {
  logger.warn('⚠️ No email service configured (SENDGRID_API_KEY or SMTP_*). Emails will be logged to console.');
}

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@learntrace.dev';

// ── Send helper ───────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // Try SendGrid first
  if (SENDGRID_CONFIGURED) {
    try {
      await sgMail.send({ to, from: FROM_EMAIL, subject, html });
      logger.info({ to }, `📧 Email sent via SendGrid`);
      return true;
    } catch (error: any) {
      logger.error({ to, error: error?.response?.body || error }, '❌ SendGrid failed — cascading to SMTP');
      // Fall through to SMTP
    }
  }

  // Try SMTP next
  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({ from: `"LearnTrace" <${FROM_EMAIL}>`, to, subject, html });
      logger.info({ to }, '📧 Email sent via SMTP');
      return true;
    } catch (error) {
      logger.error({ to, error }, '❌ SMTP also failed to send email');
    }
  }

  return false; // Console fallback handled by caller
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Send a verification email to the user.
 * If no email service is configured, logs the link to the server console.
 */
export const sendVerificationEmail = async (
  to: string,
  token: string,
  firstName: string
): Promise<string> => {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 28px; font-weight: 800; color: #1C1917; margin: 0;">LearnTrace</h1>
        <p style="color: #78716c; font-size: 14px; margin-top: 4px;">Your Personal Learning History</p>
      </div>
      
      <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 16px; padding: 32px;">
        <h2 style="font-size: 20px; color: #1C1917; margin: 0 0 12px 0;">Hey ${firstName} 👋</h2>
        <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
          Welcome to LearnTrace! Please verify your email address by clicking the button below.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verificationUrl}" 
             style="display: inline-block; background: #1C1917; color: #ffffff; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; text-decoration: none;">
            Verify My Email
          </a>
        </div>
        
        <p style="color: #a8a29e; font-size: 12px; line-height: 1.6; margin: 24px 0 0 0;">
          If the button doesn't work, copy and paste this link:<br/>
          <a href="${verificationUrl}" style="color: #f59e0b; word-break: break-all;">${verificationUrl}</a>
        </p>
      </div>
      
      <p style="text-align: center; color: #a8a29e; font-size: 11px; margin-top: 24px;">
        © ${new Date().getFullYear()} LearnTrace. If you didn't create an account, please ignore this email.
      </p>
    </div>
  `;

  const sent = await sendEmail(to, '✅ Verify your LearnTrace email address', html);

  if (!sent) {
    // Dev fallback: log the link to the server console
    logger.info('─'.repeat(60));
    logger.info({ to, verificationUrl }, '📧 [DEV MODE] Verification link generated');
    logger.info('─'.repeat(60));
  }

  return verificationUrl;
};

/**
 * Send a password reset email to the user.
 */
export const sendPasswordResetEmail = async (
  to: string,
  token: string,
  firstName: string
): Promise<string> => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 28px; font-weight: 800; color: #1C1917; margin: 0;">LearnTrace</h1>
        <p style="color: #78716c; font-size: 14px; margin-top: 4px;">Your Personal Learning History</p>
      </div>
      
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px;">
        <h2 style="font-size: 20px; color: #1C1917; margin: 0 0 12px 0;">Hey ${firstName}</h2>
        <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
          We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; background: #1C1917; color: #ffffff; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; text-decoration: none;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #a8a29e; font-size: 12px; line-height: 1.6; margin: 24px 0 0 0;">
          If the button doesn't work, copy and paste this link:<br/>
          <a href="${resetUrl}" style="color: #f59e0b; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
    </div>
  `;

  const sent = await sendEmail(to, '🔐 Reset your LearnTrace password', html);

  if (!sent) {
    logger.info('─'.repeat(60));
    logger.info({ to, resetUrl }, '📧 [DEV MODE] Password reset link generated');
    logger.info('─'.repeat(60));
  }

  return resetUrl;
};

/**
 * Send a verification email to the user (backend-verified flow).
 * The link hits the backend /api/v1/auth/verify-email endpoint which
 * marks the email verified and then redirects to the frontend.
 */
export async function sendVerificationEmailToUser(
  email: string,
  token: string,
  firstName: string
): Promise<void> {
  const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/+$/, '');
  const verifyLink = `${BACKEND_URL}/api/v1/auth/verify-email?token=${token}`;

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
      <h2 style="font-size:24px;font-weight:800;color:#111827;margin-bottom:8px">
        Verify your LearnTrace email
      </h2>
      <p style="color:#6b7280;margin-bottom:24px">
        Hi ${firstName}, click the button below to verify your email address and activate your account.
      </p>
      <a href="${verifyLink}"
         style="display:inline-block;background:#f59e0b;color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:15px">
        Verify Email Address
      </a>
      <p style="margin-top:24px;color:#9ca3af;font-size:13px">
        Or paste this link in your browser:<br/>
        <span style="word-break:break-all;color:#374151">${verifyLink}</span>
      </p>
      <p style="margin-top:16px;color:#9ca3af;font-size:12px">
        This link does not expire. If you didn't sign up, ignore this email.
      </p>
    </div>
  `;

  const sent = await sendEmail(email, 'Verify your LearnTrace email address', html);

  if (!sent) {
    logger.info('─'.repeat(60));
    logger.info({ email, verifyLink }, '📧 [DEV MODE] Verification link generated');
    logger.info('─'.repeat(60));
  } else {
    logger.info({ email }, '📧 Verification email sent');
  }
}
