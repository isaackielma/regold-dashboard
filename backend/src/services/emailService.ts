import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

let transport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transport;
}

export async function sendVerificationEmail(to: string, token: string, name?: string): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  const link = `${baseUrl}/verify-email?token=${token}`;

  try {
    await getTransport().sendMail({
      from: process.env.EMAIL_FROM ?? 'noreply@rebijoux.com',
      to,
      subject: 'Confirm your email address — Regolda Dashboard',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#F5F5F0;font-family:Georgia,serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:40px 20px;">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0e0e0;">

                  <!-- Header -->
                  <tr>
                    <td style="background:#1B9AAA;padding:32px 40px;">
                      <p style="margin:0;font-size:22px;color:#ffffff;letter-spacing:1px;">REGOLDA</p>
                      <p style="margin:4px 0 0;font-size:11px;color:#ffffff;opacity:0.7;letter-spacing:2px;text-transform:uppercase;">by Rebijoux</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">
                      <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.6;">
                        Dear ${name ?? 'Client'},
                      </p>
                      <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
                        An account has been created for you on the <strong>Regolda Dashboard</strong>, 
                        our institutional platform for allocated recycled gold token holdings.
                      </p>
                      <p style="margin:0 0 32px;font-size:15px;color:#333333;line-height:1.6;">
                        To complete your registration and activate access, please confirm 
                        your email address by clicking the button below:
                      </p>

                      <!-- Button -->
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background:#1B9AAA;">
                            <a href="${link}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:13px;color:#ffffff;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">
                              Confirm Email Address
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:32px 0 16px;font-size:13px;color:#888888;line-height:1.6;">
                        If the button does not work, copy and paste the following link into your browser:
                      </p>
                      <p style="margin:0 0 32px;font-size:12px;color:#1B9AAA;word-break:break-all;">
                        ${link}
                      </p>

                      <hr style="border:none;border-top:1px solid #eeeeee;margin:32px 0;" />

                      <p style="margin:0 0 8px;font-size:13px;color:#888888;line-height:1.6;">
                        If you did not initiate this request, please disregard this message. 
                        No access will be granted without email verification.
                      </p>
                      <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;">
                        For assistance, contact 
                        <a href="mailto:contact@rebijoux.fr" style="color:#1B9AAA;">contact@rebijoux.fr</a>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f9f9f7;padding:24px 40px;border-top:1px solid #eeeeee;">
                      <p style="margin:0;font-size:12px;color:#aaaaaa;">
                        Regolda Operations Team &nbsp;·&nbsp; Rebijoux UPDF &nbsp;·&nbsp; 
                        This is an automated message, please do not reply directly.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    logger.info('Verification email sent', { to });
  } catch (err) {
    logger.error('Failed to send verification email', { to, error: (err as Error).message });
    throw err;
  }
}