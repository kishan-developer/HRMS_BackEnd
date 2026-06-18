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
  const subject = `Leave Request ${status}`;
  const html = `
    <h2>Leave Request ${status}</h2>
    <p>Dear ${employeeName},</p>
    <p>Your ${leaveType} leave request has been ${status.toLowerCase()}.</p>
    ${reason ? `<p>Reason: ${reason}</p>` : ''}
    <p>Best regards,<br>HR Team</p>
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
  const subject = `New Leave Request - ${employeeName}`;
  const html = `
    <h2>New Leave Request</h2>
    <p>Dear Manager,</p>
    <p>${employeeName} has requested ${leaveType} leave from ${fromDate} to ${toDate}.</p>
    <p>Please review and approve/reject the request in the HRMS portal.</p>
    <p>Best regards,<br>HR System</p>
  `;
  await sendEmail(managerEmail, subject, html);
};

export const sendVerificationOTPEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  const subject = 'Verify Your Email - Coral Group HRMS';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #94cb3d;">Verify Your Email</h2>
      <p>Dear User,</p>
      <p>Thank you for registering with Coral Group HRMS. Please use the following OTP to verify your email address:</p>
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #94cb3d;">${otp}</span>
      </div>
      <p>This OTP will expire in 5 minutes.</p>
      <p>If you did not request this verification, please ignore this email.</p>
      <p>Best regards,<br>Coral Group HRMS Team</p>
    </div>
  `;
  await sendEmail(email, subject, html);
};

export const sendPasswordResetOTPEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  const subject = 'Password Reset OTP - Coral Group HRMS';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #94cb3d;">Password Reset Request</h2>
      <p>Dear User,</p>
      <p>We received a request to reset your password. Please use the following OTP to reset your password:</p>
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #94cb3d;">${otp}</span>
      </div>
      <p>This OTP will expire in 5 minutes.</p>
      <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
      <p>Best regards,<br>Coral Group HRMS Team</p>
    </div>
  `;
  await sendEmail(email, subject, html);
};
