import nodemailer from 'nodemailer';
import logger from '../lib/logger';

const SMTP_CONFIGURED = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

let transporter: nodemailer.Transporter | null = null;

if (SMTP_CONFIGURED) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify SMTP connection on startup
  transporter.verify((error) => {
    if (error) {
      logger.error({ error }, '❌ SMTP connection failed. Emails will not be sent.');
      transporter = null;
    } else {
      logger.info('✅ SMTP connected — email sending is active.');
    }
  });
} else {
  logger.warn('⚠️ SMTP not configured. Verification emails will be logged to console instead.');
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@learntrace.dev';

/**
 * Send a verification email to the user.
 * If SMTP is not configured, logs the verification link to the server console.
 * Returns the verification URL so the caller can optionally surface it in dev mode.
 */
export const sendVerificationEmail = async (
  to: string,
  token: string,
  firstName: string
): Promise<string> => {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"LearnTrace" <${FROM_EMAIL}>`,
        to,
        subject: '✅ Verify your LearnTrace email address',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 28px; font-weight: 800; color: #1C1917; margin: 0;">LearnTrace</h1>
              <p style="color: #78716c; font-size: 14px; margin-top: 4px;">Your Personal Learning History</p>
            </div>
            
            <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 16px; padding: 32px;">
              <h2 style="font-size: 20px; color: #1C1917; margin: 0 0 12px 0;">Hey ${firstName} 👋</h2>
              <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Welcome to LearnTrace! Please verify your email address by clicking the button below. This helps us keep your account secure.
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
        `,
      });

      logger.info({ to }, '📧 Verification email sent successfully');
    } catch (error) {
      logger.error({ to, error }, '❌ Failed to send verification email');
    }
  } else {
    // Dev fallback: log the link to the server console
    logger.info('─'.repeat(60));
    logger.info({ to, verificationUrl }, '📧 [DEV MODE] Verification link generated');
    logger.info('─'.repeat(60));
  }

  return verificationUrl;
};
