import nodemailer from "nodemailer";

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || "587");
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Global Shelf BD <no-reply@globalshelfbd.com>";

/**
 * Send 4-digit OTP email using Nodemailer with HTML template
 */
export async function sendOtpEmail(to: string, otp: string, recipientName: string = "Valued Customer") {
  // If SMTP credentials are not configured, log to console for development testing
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.log("\n=======================================================");
    console.log(`[DEV EMAIL SIMULATOR] To: ${to}`);
    console.log(`[DEV EMAIL SIMULATOR] Subject: Password Reset OTP Code`);
    console.log(`[DEV EMAIL SIMULATOR] Your 4-digit OTP is: ${otp}`);
    console.log("=======================================================\n");
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 550px; margin: 30px auto; background: #ffffff; border-radius: 16px; padding: 40px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .logo { text-align: center; margin-bottom: 25px; }
          .logo-title { font-size: 24px; font-weight: 800; color: #0f172a; text-decoration: none; }
          .logo-accent { color: #0284c7; }
          .title { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 12px; }
          .text { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
          .otp-box { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px dashed #0284c7; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0; }
          .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #0369a1; font-family: monospace; }
          .warning { font-size: 13px; color: #64748b; margin-top: 20px; text-align: center; border-t: 1px solid #f1f5f9; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <span class="logo-title">Global Shelf <span class="logo-accent">BD</span></span>
          </div>
          <h2 class="title">Password Reset Verification Code</h2>
          <p class="text">Hello ${recipientName},</p>
          <p class="text">We received a request to reset your password for your Global Shelf BD account. Use the 4-digit verification code below to proceed:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p class="text">This verification code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email or contact support immediately.</p>
          <div class="warning">
            This is an automated security email. Please do not reply directly to this message.
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject: `${otp} is your Global Shelf BD Verification Code`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}
