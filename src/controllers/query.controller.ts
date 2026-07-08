import { Request, Response, NextFunction } from 'express';
import { Query } from '../models/query.model';
import { generateId } from '../utils/uuid.utils';
import nodemailer from 'nodemailer';
import path from 'path';

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
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

const LOGO_URL = "cid:coral-logo";

// User Email Template for Query
const getUserQueryEmailTemplate = (variables: any) => {
  const { NAME, EMAIL, PHONE, PROPERTY_INTEREST, SOURCE, MESSAGE } = variables;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Query Submission Confirmation</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.6);">

        <!-- Header with Logo -->
        <tr>
          <td style="background:linear-gradient(135deg,#94cb3d 0%,#7ab532 50%,#5a8a1a 100%);padding:45px 40px;text-align:center;position:relative;">
            <img src="${LOGO_URL}" alt="Coral Group" width="180" style="display:block;margin:0 auto 16px;max-width:180px;" />
            <p style="color:rgba(0,0,0,0.7);margin:8px 0 0;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Premium Real Estate Developers</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#141414;padding:45px 40px;">
            <h2 style="color:#ffffff;margin:0 0 12px;font-size:24px;font-weight:700;">Thank You, ${NAME}!</h2>
            <p style="color:#b0b0b0;font-size:15px;line-height:1.7;margin:0 0 28px;">
              Your query for <strong style="color:#94cb3d;">${PROPERTY_INTEREST}</strong> has been successfully received. Our team will contact you shortly.
            </p>

            <!-- Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1f1f1f;border-radius:12px;margin-bottom:32px;overflow:hidden;border:1px solid #2a2a2a;">
              <tr>
                <td style="background:linear-gradient(135deg,#94cb3d 0%,#7ab532 100%);padding:16px 24px;">
                  <p style="color:#000000;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin:0;">📋 Query Details</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#707070;font-size:13px;padding:10px 0;width:40%;border-bottom:1px solid #2a2a2a;">Property Interest</td>
                      <td style="color:#ffffff;font-size:14px;padding:10px 0;border-bottom:1px solid #2a2a2a;font-weight:600;">${PROPERTY_INTEREST}</td>
                    </tr>
                    <tr>
                      <td style="color:#707070;font-size:13px;padding:10px 0;border-bottom:1px solid #2a2a2a;">Email</td>
                      <td style="color:#ffffff;font-weight:600;font-style:italic;font-size:14px;padding:10px 0;border-bottom:1px solid #2a2a2a;">${EMAIL}</td>
                    </tr>
                    <tr>
                      <td style="color:#707070;font-size:13px;padding:10px 0;border-bottom:1px solid #2a2a2a;">Phone</td>
                      <td style="color:#ffffff;font-size:14px;padding:10px 0;border-bottom:1px solid #2a2a2a;">${PHONE}</td>
                    </tr>
                    <tr>
                      <td style="color:#707070;font-size:13px;padding:10px 0;border-bottom:1px solid #2a2a2a;">Source</td>
                      <td style="color:#94cb3d;font-size:14px;padding:10px 0;border-bottom:1px solid #2a2a2a;font-weight:600;text-transform:uppercase;">${SOURCE}</td>
                    </tr>
                    <tr>
                      <td style="color:#707070;font-size:13px;padding:10px 0;vertical-align:top;">Message</td>
                      <td style="color:#ffffff;font-size:14px;padding:10px 0;">${MESSAGE}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="color:#888888;font-size:14px;line-height:1.7;margin:0 0 32px;">
              Our executive will reach out to you for a personalized consultation to help you find your dream property.
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;">
              <tr>
                <td style="background:linear-gradient(135deg,#94cb3d,#7ab532);border-radius:10px;padding:16px 40px;text-align:center;box-shadow:0 4px 20px rgba(148,203,61,0.3);">
                  <a href="https://coral-group.in/" style="color:#000000;font-size:16px;font-weight:700;text-decoration:none;display:block;">Visit Our Website →</a>
                </td>
              </tr>
            </table>

            <!-- Contact Info -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:10px;padding:20px;">
              <tr>
                <td align="center">
                  <p style="color:#ffffff;font-size:16px;margin:0 0 8px;">Need immediate assistance?</p>
                  <p style="color:#ffffff;font-size:16px;margin:0;font-weight:600;">📞 (+91) 780-000-0097</p>
                  <p style="color:#ffffff;font-size:16px;margin:4px 0 0;font-weight:600;">✉️ info@coral-group.in</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#0f0f0f;padding:28px 40px;text-align:center;border-top:1px solid #1f1f1f;">
            <p style="color:#ffffff;font-size:10px;margin:0;">© 2026 Coral Group. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// Admin Email Template for Query
const getAdminQueryEmailTemplate = (variables: any) => {
  const { NAME, EMAIL, PHONE, PROPERTY_INTEREST, SOURCE, MESSAGE, TIMESTAMP } = variables;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Query Lead</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.6);">

        <!-- Header with Logo -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 100%);padding:32px 40px;border-bottom:3px solid #94cb3d;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <img src="${LOGO_URL}" alt="Coral Group" width="140" style="display:block;max-width:140px;" />
                </td>
                <td align="right">
                  <div style="background:linear-gradient(135deg,#94cb3d 0%,#7ab532 100%);color:#000000;font-size:12px;font-weight:800;padding:10px 20px;border-radius:25px;text-transform:uppercase;letter-spacing:1px;box-shadow:0 4px 15px rgba(148,203,61,0.4);">
                     New Lead
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Alert Banner -->
        <tr>
          <td style="background:linear-gradient(90deg,#94cb3d 0%,#7ab532 100%);padding:20px 40px;text-align:center;">
            <h2 style="color:#000000;margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;">New Query Submission — Action Required</h2>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#141414;padding:40px;">
            <p style="color:#a0a0a0;font-size:14px;margin:0 0 28px;">
              A new query has been submitted on <strong style="color:#94cb3d;">${TIMESTAMP}</strong>
            </p>

            <!-- Lead Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1f1f1f;border-radius:12px;margin-bottom:28px;overflow:hidden;border:1px solid #2a2a2a;">
              <tr>
                <td style="background:linear-gradient(135deg,#94cb3d 0%,#7ab532 100%);padding:18px 24px;">
                  <p style="color:#000000;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin:0;">👤 Lead Information</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#606060;font-size:13px;padding:12px 0;border-bottom:1px solid #2a2a2a;width:35%;">Name</td>
                      <td style="color:#ffffff;font-size:14px;padding:12px 0;border-bottom:1px solid #2a2a2a;font-weight:600;">${NAME}</td>
                    </tr>
                    <tr>
                      <td style="color:#606060;font-size:13px;padding:12px 0;border-bottom:1px solid #2a2a2a;">Email</td>
                      <td style="color:#94cb3d;font-size:14px;padding:12px 0;border-bottom:1px solid #2a2a2a;">
                        <a href="mailto:${EMAIL}" style="color:#94cb3d;text-decoration:none;font-weight:600;">${EMAIL}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="color:#606060;font-size:13px;padding:12px 0;border-bottom:1px solid #2a2a2a;">Phone</td>
                      <td style="color:#94cb3d;font-size:14px;padding:12px 0;border-bottom:1px solid #2a2a2a;">
                        <a href="tel:${PHONE}" style="color:#94cb3d;text-decoration:none;font-weight:600;">${PHONE}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="color:#606060;font-size:13px;padding:12px 0;border-bottom:1px solid #2a2a2a;">Property Interest</td>
                      <td style="color:#94cb3d;font-size:14px;padding:12px 0;border-bottom:1px solid #2a2a2a;font-weight:600;text-transform:uppercase;">${PROPERTY_INTEREST}</td>
                    </tr>
                    <tr>
                      <td style="color:#606060;font-size:13px;padding:12px 0;border-bottom:1px solid #2a2a2a;">Source</td>
                      <td style="color:#ffffff;font-size:14px;padding:12px 0;border-bottom:1px solid #2a2a2a;">${SOURCE}</td>
                    </tr>
                    <tr>
                      <td style="color:#606060;font-size:13px;padding:12px 0;vertical-align:top;">Message</td>
                      <td style="color:#ffffff;font-size:14px;padding:12px 0;">${MESSAGE}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Action Alert -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(148,203,61,0.1) 0%,rgba(122,181,50,0.1) 100%);border:2px solid #94cb3d;border-radius:12px;padding:20px;">
              <tr>
                <td align="center">
                  <p style="color:#94cb3d;font-size:15px;margin:0 0 8px;font-weight:700;">⚡ Follow Up Required</p>
                  <p style="color:#b0b0b0;font-size:13px;margin:0;">Please contact this lead <strong style="color:#ffffff;">within 24 hours</strong> for best conversion rate.</p>
                </td>
              </tr>
            </table>

            <!-- Quick Actions -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
              <tr>
                <td align="center">
                  <a href="mailto:${EMAIL}" style="display:inline-block;background:#2a2a2a;color:#94cb3d;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;margin:0 4px;border:1px solid #3a3a3a;">
                    📧 Reply via Email
                  </a>
                  <a href="tel:${PHONE}" style="display:inline-block;background:#2a2a2a;color:#94cb3d;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;margin:0 4px;border:1px solid #3a3a3a;">
                    📞 Call Now
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#0f0f0f;padding:24px 40px;text-align:center;border-top:1px solid #1f1f1f;">
            <p style="color:#404040;font-size:11px;margin:0;">Coral Group Internal Notification System</p>
            <p style="color:#303030;font-size:10px;margin:4px 0 0;">coral-group.in | ${TIMESTAMP}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// Create a new query/lead
export const createQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clientName, email, phone, message, propertyInterest, source } = req.body;

    // Validate required fields
    if (!clientName || !email || !phone || !message || !propertyInterest || !source) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: clientName, email, phone, message, propertyInterest, source',
        },
      });
      return;
    }

    // Generate unique query ID
    const queryId = `QRY-${generateId().substring(0, 8).toUpperCase()}`;

    // Create new query
    const query = await Query.create({
      queryId,
      clientName,
      email,
      phone,
      message,
      propertyInterest,
      source,
      status: 'New',
    });

    res.status(201).json({
      success: true,
      message: 'Query submitted successfully',
      data: {
        queryId: query.queryId,
        clientName: query.clientName,
        email: query.email,
        phone: query.phone,
        message: query.message,
        propertyInterest: query.propertyInterest,
        source: query.source,
        status: query.status,
        createdAt: query.createdAt,
      },
    });

    // Send emails in background (non-blocking - won't affect client response)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn("Email credentials not set (SMTP_USER / SMTP_PASSWORD). Skipping email send.");
      return;
    }

    const transporter = createTransporter();

    const userMailHtml = getUserQueryEmailTemplate({
      NAME: clientName,
      EMAIL: email,
      PHONE: phone,
      PROPERTY_INTEREST: propertyInterest,
      SOURCE: source,
      MESSAGE: message
    });

    const adminMailHtml = getAdminQueryEmailTemplate({
      NAME: clientName,
      EMAIL: email,
      PHONE: phone,
      PROPERTY_INTEREST: propertyInterest,
      SOURCE: source,
      MESSAGE: message,
      TIMESTAMP: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

    const userMailOptions = {
      from: `"Coral Group" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Your Query for ${propertyInterest} - Coral Group`,
      html: userMailHtml,
      attachments: [
        {
          filename: 'CORALGREEN.JPG',
          path: path.join(__dirname, '../image/CORALGREEN.JPG'),
          cid: 'coral-logo'
        }
      ]
    };

    const adminMailOptions = {
      from: `"Coral Group Website" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || "info@coral-group.in",
      replyTo: `"${clientName}" <${email}>`,
      subject: `New Query Lead: ${clientName} — ${propertyInterest}`,
      html: adminMailHtml,
      attachments: [
        {
          filename: 'CORALGREEN.JPG',
          path: path.join(__dirname, '../image/CORALGREEN.JPG'),
          cid: 'coral-logo'
        }
      ]
    };

    Promise.all([
      transporter.sendMail(userMailOptions),
      transporter.sendMail(adminMailOptions),
    ]).then(() => {
      console.log(`Emails sent successfully for query: ${email}`);
    }).catch((emailError) => {
      console.error("Email sending failed:", emailError.message);
    });
  } catch (error) {
    next(error);
  }
};

// Get all queries (admin only)
export const getAllQueries = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter: any = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const queries = await Query.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Query.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: queries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get query by ID
export const getQueryById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const query = await Query.findOne({ queryId: id });

    if (!query) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Query not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: query,
    });
  } catch (error) {
    next(error);
  }
};

// Update query status
export const updateQueryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const query = await Query.findOneAndUpdate(
      { queryId: id },
      { status, notes },
      { new: true, runValidators: true }
    );

    if (!query) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Query not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Query updated successfully',
      data: query,
    });
  } catch (error) {
    next(error);
  }
};

// Delete query
export const deleteQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const query = await Query.findOneAndDelete({ queryId: id });

    if (!query) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Query not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Query deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
