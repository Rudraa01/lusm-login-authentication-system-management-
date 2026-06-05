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
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
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
 * Send OTP email to the end-user
 * @param {string} to - Recipient email address
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} type - "SIGNUP" or "RESET"
 * @param {string} projectName - Name of the developer's project
 */
const sendOtpEmail = async (to, otpCode, type, projectName = 'LUSM') => {
  const transport = await initTransporter();

  const subject =
    type === 'SIGNUP'
      ? `${projectName} - Verify your email`
      : `${projectName} - Reset your password`;

  const actionText =
    type === 'SIGNUP' ? 'verify your email address' : 'reset your password';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-radius:16px;border:1px solid #334155;overflow:hidden;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%);padding:32px 24px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">🔐 ${projectName}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Powered by LUSM</p>
        </div>
        
        <!-- Content -->
        <div style="padding:32px 24px;">
          <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Use the following code to ${actionText}. This code will expire in <strong style="color:#e2e8f0;">10 minutes</strong>.
          </p>
          
          <!-- OTP Code -->
          <div style="background:rgba(99,102,241,0.1);border:2px dashed #6366f1;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
            <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#a5b4fc;font-family:'Courier New',monospace;">
              ${otpCode}
            </span>
          </div>

          <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
            If you didn't request this code, you can safely ignore this email. Someone may have typed your email address by mistake.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:16px 24px;border-top:1px solid #1e293b;text-align:center;">
          <p style="color:#475569;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} LUSM — Free Authentication Service
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transport.sendMail({
    from: `"${projectName} via LUSM" <noreply@lusm.dev>`,
    to,
    subject,
    html: htmlContent,
  });

  console.log(`\n🔑 [LUSM] Verification OTP for ${to} is: ${otpCode}\n`);

  // Log Ethereal preview URL in development
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 OTP Email Preview: ${previewUrl}`);
  }

  return info;
};

module.exports = {
  initTransporter,
  sendOtpEmail,
};
