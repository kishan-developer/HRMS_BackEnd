import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Dark background email template with Coral Group branding
const generateAttendanceReportEmail = (
  recipientName: string,
  employeeId: string,
  attendanceData: any[],
  reportPeriod: { startDate: Date; endDate: Date }
) => {
  const presentCount = attendanceData.filter((r) => r.status === 'Present').length;
  const lateCount = attendanceData.filter((r) => r.status === 'Late').length;
  const absentCount = attendanceData.filter((r) => r.status === 'Absent').length;
  const leaveCount = attendanceData.filter((r) => r.status === 'Leave').length;

  const startDate = reportPeriod.startDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const endDate = reportPeriod.endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Attendance Report - Coral Group</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #1a1a1a;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #2d2d2d;
        }
        .header {
          background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
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
          padding: 30px;
          color: #e0e0e0;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .report-info {
          background-color: #3d3d3d;
          border-left: 4px solid #FF6B6B;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .report-info p {
          margin: 5px 0;
          font-size: 14px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 25px 0;
        }
        .stat-card {
          background-color: #3d3d3d;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-card .number {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        .stat-card .label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.7;
        }
        .stat-card.present .number {
          color: #4CAF50;
        }
        .stat-card.late .number {
          color: #FF9800;
        }
        .stat-card.absent .number {
          color: #F44336;
        }
        .stat-card.leave .number {
          color: #2196F3;
        }
        .table-section {
          margin: 25px 0;
        }
        .table-section h3 {
          color: #FF6B6B;
          margin-bottom: 15px;
          font-size: 16px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background-color: #3d3d3d;
        }
        th {
          background-color: #4d4d4d;
          color: #FF6B6B;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #4d4d4d;
          font-size: 13px;
        }
        tr:last-child td {
          border-bottom: none;
        }
        .footer {
          background-color: #1a1a1a;
          padding: 20px;
          text-align: center;
          color: #888;
          font-size: 12px;
        }
        .footer p {
          margin: 5px 0;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        .status-present {
          background-color: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }
        .status-late {
          background-color: rgba(255, 152, 0, 0.2);
          color: #FF9800;
        }
        .status-absent {
          background-color: rgba(244, 67, 54, 0.2);
          color: #F44336;
        }
        .status-leave {
          background-color: rgba(33, 150, 243, 0.2);
          color: #2196F3;
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
          <p class="greeting">Dear ${recipientName},</p>
          
          <p>Please find attached the attendance report for <strong>Employee ID: ${employeeId}</strong> for the period from <strong>${startDate}</strong> to <strong>${endDate}</strong>.</p>
          
          <div class="report-info">
            <p><strong>Employee ID:</strong> ${employeeId}</p>
            <p><strong>Report Period:</strong> ${startDate} - ${endDate}</p>
            <p><strong>Total Records:</strong> ${attendanceData.length}</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card present">
              <div class="number">${presentCount}</div>
              <div class="label">Present</div>
            </div>
            <div class="stat-card late">
              <div class="number">${lateCount}</div>
              <div class="label">Late</div>
            </div>
            <div class="stat-card absent">
              <div class="number">${absentCount}</div>
              <div class="label">Absent</div>
            </div>
            <div class="stat-card leave">
              <div class="number">${leaveCount}</div>
              <div class="label">Leave</div>
            </div>
          </div>
          
          <div class="table-section">
            <h3>Attendance Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${attendanceData.slice(0, 10).map((record) => `
                  <tr>
                    <td>${new Date(record.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}</td>
                    <td>${record.punchInTime || '--:--'}</td>
                    <td>${record.punchOutTime || '--:--'}</td>
                    <td><span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span></td>
                  </tr>
                `).join('')}
                ${attendanceData.length > 10 ? `
                  <tr>
                    <td colspan="4" style="text-align: center; color: #888; font-style: italic;">
                      ... and ${attendanceData.length - 10} more records. Please see attached PDF for complete details.
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
          
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
};

export class EmailService {
  async sendAttendanceReport(
    recipientEmail: string,
    recipientName: string,
    employeeId: string,
    attendanceData: any[],
    reportPeriod: { startDate: Date; endDate: Date }
  ): Promise<boolean> {
    try {
      const htmlContent = generateAttendanceReportEmail(
        recipientName,
        employeeId,
        attendanceData,
        reportPeriod
      );

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: recipientEmail,
        subject: `Attendance Report - ${employeeId} - Coral Group`,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${recipientEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      return false;
    }
  }
}

export default new EmailService();
