import nodemailer from 'nodemailer';

const getTransporter = () => {
  console.log('SMTP Config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    hasPassword: !!process.env.SMTP_PASSWORD,
  });

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const verifySMTPConnection = async (): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('✅ SMTP Connected Successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP Connection Failed:', error);
    return false;
  }
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email via SMTP:', error);
    if (process.env.NODE_ENV !== 'production') {
      console.log('--------------------------------------------------');
      console.log(`DEVELOPMENT FALLBACK: Email Details for ${to}`);
      console.log(`Subject: ${subject}`);
      // Clean up basic HTML tags for clean terminal printing
      const textOnly = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      console.log(`Body (Text): ${textOnly}`);
      console.log('--------------------------------------------------');
      return; // Do not throw in development, allow registration/verification to proceed
    }
    throw error;
  }
};

export const sendLeaveApprovalEmail = async (
  email: string,
  employeeName: string,
  leaveType: string,
  status: 'Approved' | 'Rejected',
  reason?: string
): Promise<void> => {
  const subject = `Leave Request ${status} - Coral Group HRMS`;
  const statusColor = status === 'Approved' ? '#4CAF50' : '#F44336';
  const statusBg = status === 'Approved' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Leave Request ${status}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #0f0f0f;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #1a1a1a;
        }
        .header {
          background: linear-gradient(135deg, #94cb3d 0%, #7ab32e 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .header p {
          color: #ffffff;
          margin: 10px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
          color: #e0e0e0;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .status-badge {
          display: inline-block;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          background-color: ${statusBg};
          color: ${statusColor};
          margin: 20px 0;
        }
        .info-box {
          background-color: #2a2a2a;
          border-left: 4px solid #94cb3d;
          padding: 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .info-box p {
          margin: 8px 0;
          font-size: 14px;
        }
        .info-box strong {
          color: #94cb3d;
        }
        .reason-box {
          background-color: #2a2a2a;
          padding: 20px;
          margin: 25px 0;
          border-radius: 8px;
          border: 1px solid #3a3a3a;
        }
        .reason-box p {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
        }
        .footer {
          background-color: #0f0f0f;
          padding: 25px;
          text-align: center;
          color: #888;
          font-size: 12px;
          border-top: 1px solid #2a2a2a;
        }
        .footer p {
          margin: 8px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #94cb3d 0%, #7ab32e 100%);
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>CORAL GROUP</h1>
          <p>Human Resource Management System</p>
        </div>
        
        <div class="content">
          <p class="greeting">Dear ${employeeName},</p>
          
          <p>We're writing to inform you about your leave request status.</p>
          
          <div class="status-badge">
            ${status.toUpperCase()}
          </div>
          
          <div class="info-box">
            <p><strong>Leave Type:</strong> ${leaveType}</p>
            <p><strong>Status:</strong> ${status}</p>
          </div>
          
          ${reason ? `
          <div class="reason-box">
            <p><strong>Reason:</strong> ${reason}</p>
          </div>
          ` : ''}
          
          <p style="margin-top: 25px;">If you have any questions or need further assistance, please contact the HR department.</p>
          
          <p style="margin-top: 20px;">Best regards,<br><strong>Coral Group HR Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Coral Group. All rights reserved.</p>
          <p>This is an automated email, please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail(email, subject, html);
};

export const sendLeaveRequestEmail = async (
  managerEmail: string,
  employeeName: string,
  leaveType: string,
  fromDate: string,
  toDate: string
): Promise<void> => {
  const subject = `New Leave Request - ${employeeName} - Coral Group HRMS`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Leave Request</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #0f0f0f;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #1a1a1a;
        }
        .header {
          background: linear-gradient(135deg, #94cb3d 0%, #7ab32e 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .header p {
          color: #ffffff;
          margin: 10px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
          color: #e0e0e0;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .alert-box {
          background-color: rgba(148, 203, 61, 0.1);
          border: 1px solid #94cb3d;
          padding: 20px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .alert-box p {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
        }
        .info-box {
          background-color: #2a2a2a;
          border-left: 4px solid #94cb3d;
          padding: 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .info-box p {
          margin: 8px 0;
          font-size: 14px;
        }
        .info-box strong {
          color: #94cb3d;
        }
        .footer {
          background-color: #0f0f0f;
          padding: 25px;
          text-align: center;
          color: #888;
          font-size: 12px;
          border-top: 1px solid #2a2a2a;
        }
        .footer p {
          margin: 8px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #94cb3d 0%, #7ab32e 100%);
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>CORAL GROUP</h1>
          <p>Human Resource Management System</p>
        </div>
        
        <div class="content">
          <p class="greeting">Dear Manager,</p>
          
          <div class="alert-box">
            <p><strong>New Leave Request Received</strong></p>
          </div>
          
          <p>${employeeName} has submitted a leave request that requires your attention.</p>
          
          <div class="info-box">
            <p><strong>Employee Name:</strong> ${employeeName}</p>
            <p><strong>Leave Type:</strong> ${leaveType}</p>
            <p><strong>From:</strong> ${fromDate}</p>
            <p><strong>To:</strong> ${toDate}</p>
          </div>
          
          <p style="margin-top: 25px;">Please review and approve or reject this request in the HRMS portal at your earliest convenience.</p>
          
          <p style="margin-top: 20px;">Best regards,<br><strong>Coral Group HR System</strong></p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Coral Group. All rights reserved.</p>
          <p>This is an automated email, please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail(managerEmail, subject, html);
};

export const sendVerificationOTPEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  const subject = 'Verify Your Email - Coral Group HRMS';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #0f0f0f;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #1a1a1a;
        }
        .header {
          background: linear-gradient(135deg, #94cb3d 0%, #7ab32e 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .header p {
          color: #ffffff;
          margin: 10px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
          color: #e0e0e0;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .otp-container {
          background: linear-gradient(135deg, rgba(148, 203, 61, 0.2) 0%, rgba(122, 179, 46, 0.2) 100%);
          border: 2px solid #94cb3d;
          padding: 30px;
          margin: 30px 0;
          border-radius: 12px;
          text-align: center;
        }
        .otp-code {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 8px;
          color: #94cb3d;
          margin: 10px 0;
        }
        .otp-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #888;
          margin-bottom: 10px;
        }
        .info-box {
          background-color: #2a2a2a;
          padding: 20px;
          margin: 25px 0;
          border-radius: 8px;
          border-left: 4px solid #94cb3d;
        }
        .info-box p {
          margin: 8px 0;
          font-size: 14px;
        }
        .warning-box {
          background-color: rgba(255, 152, 0, 0.1);
          border: 1px solid #FF9800;
          padding: 15px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .warning-box p {
          margin: 0;
          font-size: 13px;
          color: #FF9800;
        }
        .footer {
          background-color: #0f0f0f;
          padding: 25px;
          text-align: center;
          color: #888;
          font-size: 12px;
          border-top: 1px solid #2a2a2a;
        }
        .footer p {
          margin: 8px 0;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>CORAL GROUP</h1>
          <p>Human Resource Management System</p>
        </div>
        
        <div class="content">
          <p class="greeting">Dear User,</p>
          
          <p>Thank you for registering with Coral Group HRMS. To complete your registration, please verify your email address using the One-Time Password (OTP) below.</p>
          
          <div class="otp-container">
            <div class="otp-label">Your Verification Code</div>
            <div class="otp-code">${otp}</div>
          </div>
          
          <div class="info-box">
            <p><strong>Important:</strong></p>
            <p>• This OTP will expire in 5 minutes</p>
            <p>• Enter this code in the verification field on the registration page</p>
            <p>• Do not share this code with anyone</p>
          </div>
          
          <div class="warning-box">
            <p>If you did not request this verification, please ignore this email. Your account will not be created without verification.</p>
          </div>
          
          <p style="margin-top: 25px;">If you have any questions or need assistance, please contact our support team.</p>
          
          <p style="margin-top: 20px;">Best regards,<br><strong>Coral Group HRMS Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Coral Group. All rights reserved.</p>
          <p>This is an automated email, please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail(email, subject, html);
};

export const sendPasswordResetOTPEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  const subject = 'Password Reset OTP - Coral Group HRMS';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #0f0f0f;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #1a1a1a;
        }
        .header {
          background: linear-gradient(135deg, #94cb3d 0%, #7ab32e 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .header p {
          color: #ffffff;
          margin: 10px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
          color: #e0e0e0;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .otp-container {
          background: linear-gradient(135deg, rgba(148, 203, 61, 0.2) 0%, rgba(122, 179, 46, 0.2) 100%);
          border: 2px solid #94cb3d;
          padding: 30px;
          margin: 30px 0;
          border-radius: 12px;
          text-align: center;
        }
        .otp-code {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 8px;
          color: #94cb3d;
          margin: 10px 0;
        }
        .otp-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #888;
          margin-bottom: 10px;
        }
        .info-box {
          background-color: #2a2a2a;
          padding: 20px;
          margin: 25px 0;
          border-radius: 8px;
          border-left: 4px solid #94cb3d;
        }
        .info-box p {
          margin: 8px 0;
          font-size: 14px;
        }
        .warning-box {
          background-color: rgba(244, 67, 54, 0.1);
          border: 1px solid #F44336;
          padding: 15px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .warning-box p {
          margin: 0;
          font-size: 13px;
          color: #F44336;
        }
        .footer {
          background-color: #0f0f0f;
          padding: 25px;
          text-align: center;
          color: #888;
          font-size: 12px;
          border-top: 1px solid #2a2a2a;
        }
        .footer p {
          margin: 8px 0;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>CORAL GROUP</h1>
          <p>Human Resource Management System</p>
        </div>
        
        <div class="content">
          <p class="greeting">Dear User,</p>
          
          <p>We received a request to reset your password for your Coral Group HRMS account. If you initiated this request, please use the One-Time Password (OTP) below to complete the password reset process.</p>
          
          <div class="otp-container">
            <div class="otp-label">Your Password Reset Code</div>
            <div class="otp-code">${otp}</div>
          </div>
          
          <div class="info-box">
            <p><strong>Important:</strong></p>
            <p>• This OTP will expire in 5 minutes</p>
            <p>• Enter this code in the password reset field</p>
            <p>• Do not share this code with anyone</p>
            <p>• After resetting, you'll need to log in with your new password</p>
          </div>
          
          <div class="warning-box">
            <p>If you did not request this password reset, please ignore this email. Your password will remain unchanged and your account security is not compromised.</p>
          </div>
          
          <p style="margin-top: 25px;">If you have any questions or need assistance, please contact our support team.</p>
          
          <p style="margin-top: 20px;">Best regards,<br><strong>Coral Group HRMS Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Coral Group. All rights reserved.</p>
          <p>This is an automated email, please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  await sendEmail(email, subject, html);
};
