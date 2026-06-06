const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize the email transporter.
 * If no SMTP credentials are configured, creates an Ethereal test account automatically.
 */
const initTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Use configured SMTP
    const port = parseInt(process.env.SMTP_PORT) || 587;
    const secure = port === 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Hostinger / custom domain SMTP often needs this to prevent SSL handshake errors
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    // Auto-create Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Using Ethereal test email account');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    console.log('   View emails at: https://ethereal.email/messages');
  }

  return transporter;
};

/**
 * Helper to generate a consistent, premium styled HTML email template
 */
const getEmailTemplate = (projectName, logoUrl, title, bodyContent, actionBoxText, actionBoxSubText = '') => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  let authEasyLogoUrl = `${frontendUrl}/logo.png`;

  // Email clients cannot load images from localhost. In development, use a public GitHub fallback.
  if (frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')) {
    authEasyLogoUrl = 'https://raw.githubusercontent.com/Rudraa01/lusm-login-authentication-system-management-/main/client/public/logo.png';
  }

  const headerLogoHtml = logoUrl 
    ? `<img src="${logoUrl}" alt="${projectName} Logo" style="max-height: 48px; max-width: 180px; object-fit: contain; margin-bottom: 8px; display: inline-block;">`
    : `<div style="display: inline-block; padding: 8px 16px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 8px; color: #a5b4fc; font-weight: 700; font-size: 20px; letter-spacing: -0.5px;">🔐 ${projectName}</div>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; table-layout: fixed; width: 100%;">
        <tr>
          <td align="center" style="padding: 40px 10px;">
            <div style="max-width: 480px; width: 100%; text-align: left; background: #111827; border-radius: 16px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);">
              
              <!-- Header -->
              <div style="padding: 32px 24px 24px; text-align: center; border-bottom: 1px solid #1f2937;">
                ${headerLogoHtml}
                <div style="margin: 12px 0 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Inter', sans-serif;">
                  ${projectName}
                </div>
              </div>

              <!-- Content Body -->
              <div style="padding: 32px 24px;">
                <h2 style="margin: 0 0 16px; color: #f3f4f6; font-size: 16px; font-weight: 600; line-height: 1.4; text-align: center; font-family: 'Inter', sans-serif;">
                  ${title}
                </h2>
                <p style="margin: 0 0 24px; color: #9ca3af; font-size: 14px; line-height: 1.6; text-align: center;">
                  ${bodyContent}
                </p>

                <!-- Action Box (OTP or Password) -->
                <div style="background: rgba(99, 102, 241, 0.04); border: 1px dashed rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <div style="font-size: 32px; font-weight: 800; color: #818cf8; font-family: monospace; letter-spacing: 6px;">
                    ${actionBoxText}
                  </div>
                  ${actionBoxSubText ? `<div style="margin-top: 8px; font-size: 12px; color: #6b7280; font-family: 'Inter', sans-serif;">${actionBoxSubText}</div>` : ''}
                </div>

                <p style="margin: 0; color: #4b5563; font-size: 12px; line-height: 1.5; text-align: center;">
                  If you didn't request this action, you can safely ignore this email. Someone may have entered your email address by mistake.
                </p>
              </div>

              <!-- Footer -->
              <div style="padding: 24px; border-top: 1px solid #1f2937; background: #0f172a; text-align: center;">
                <p style="margin: 0 0 16px; color: #4b5563; font-size: 11px;">
                  &copy; ${new Date().getFullYear()} ${projectName}. All rights reserved.
                </p>
                
                <!-- Powered by AuthEasy Brand Section -->
                <div style="display: inline-block; padding: 6px 14px; background: rgba(17, 24, 39, 0.8); border: 1px solid #1f2937; border-radius: 24px; vertical-align: middle;">
                  <span style="font-size: 11px; color: #6b7280; vertical-align: middle; margin-right: 6px; font-family: 'Inter', sans-serif;">Powered by</span>
                  <a href="${frontendUrl}" target="_blank" style="text-decoration: none; vertical-align: middle; display: inline-block;">
                    <img src="${authEasyLogoUrl}" alt="AuthEasy Logo" style="height: 22px; vertical-align: middle; display: inline-block;">
                  </a>
                </div>
              </div>

            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Send OTP email to the end-user
 * @param {string} to - Recipient email address
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} type - "SIGNUP" or "RESET"
 * @param {string} projectName - Name of the developer's project
 * @param {string} logoUrl - Custom logo of the project
 */
const sendOtpEmail = async (to, otpCode, type, projectName = 'AuthEasy', logoUrl = '') => {
  const transport = await initTransporter();

  const subject =
    type === 'SIGNUP'
      ? `${projectName} - Verify your email`
      : `${projectName} - Reset your password`;

  const actionText =
    type === 'SIGNUP' ? 'verify your email address' : 'reset your password';

  const titleText =
    type === 'SIGNUP' ? 'Email Verification Required' : 'Password Reset Requested';

  const bodyContent = `Use the following 6-digit code to ${actionText}. This verification code is valid for exactly 10 minutes.`;

  const htmlContent = getEmailTemplate(
    projectName,
    logoUrl,
    titleText,
    bodyContent,
    otpCode,
    'This code will expire in 10 minutes'
  );

  const info = await transport.sendMail({
    from: `"${projectName}" <${process.env.SMTP_USER || 'noreply@autheasy.me'}>`,
    to,
    subject,
    html: htmlContent,
  });

  console.log(`\n🔑 [AuthEasy] Verification OTP for ${to} is: ${otpCode}\n`);

  // Log Ethereal preview URL in development
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 OTP Email Preview: ${previewUrl}`);
  }

  return info;
};

/**
 * Send auto-generated new password email
 * @param {string} to - Recipient email address
 * @param {string} newPassword - Auto-generated password
 * @param {string} projectName - Name of the project/platform
 * @param {string} logoUrl - Custom logo of the project
 */
const sendPasswordResetEmail = async (to, newPassword, projectName = 'AuthEasy', logoUrl = '') => {
  const transport = await initTransporter();

  const titleText = 'Temporary Password Generated';
  const bodyContent = 'An administrator has reset your password. Please log in using the temporary credentials below and change your password immediately.';

  const htmlContent = getEmailTemplate(
    projectName,
    logoUrl,
    titleText,
    bodyContent,
    newPassword,
    'Please change this password after logging in'
  );

  const info = await transport.sendMail({
    from: `"${projectName}" <${process.env.SMTP_USER || 'noreply@autheasy.me'}>`,
    to,
    subject: `${projectName} - Your Temporary Password`,
    html: htmlContent,
  });

  return info;
};

module.exports = {
  initTransporter,
  sendOtpEmail,
  sendPasswordResetEmail,
};
