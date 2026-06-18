import { Request, Response, NextFunction } from 'express';
import { Attendance } from '../../models/attendance.model';
import { AppError } from '../../middleware/error.middleware';
import emailService from '../../services/email.service';

// Office location and geofence settings
const OFFICE_LOCATION = {
  latitude: 25.3176,
  longitude: 82.9739,
  radius: 100, // meters
};

export class AttendanceController {
  // Calculate distance between two coordinates in meters
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Check if location is within geofence
  private isWithinGeofence(latitude: number, longitude: number): boolean {
    const distance = this.calculateDistance(
      latitude,
      longitude,
      OFFICE_LOCATION.latitude,
      OFFICE_LOCATION.longitude
    );
    return distance <= OFFICE_LOCATION.radius;
  }

  // Check if employee is late (after 9:00 AM)
  private isLate(punchInTime: string): boolean {
    const [hours] = punchInTime.split(':').map(Number);
    return hours >= 9;
  }

  punchIn = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { 
        employeeId, 
        latitude, 
        longitude, 
        address,
        selfie,
        deviceInfo 
      } = req.body;
      
      // Get employeeId from authenticated user if not provided in request body
      const finalEmployeeId = employeeId || (req as any).user?.employeeId;
      
      if (!finalEmployeeId) {
        throw new AppError('Employee ID is required. Please ensure your user account has an employee ID assigned.', 400, 'EMPLOYEE_ID_REQUIRED');
      }
      
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      const time = new Date().toTimeString().slice(0, 8);

      // Check if already punched in today
      const existing = await Attendance.findOne({ employeeId: finalEmployeeId, date });
      if (existing) {
        throw new AppError('Already punched in for today', 400, 'ALREADY_PUNCHED_IN');
      }

      // Verify geofence
      const isWithinOffice = this.isWithinGeofence(latitude, longitude);
      if (!isWithinOffice) {
        throw new AppError('You are outside the office geofence. Cannot check in.', 400, 'OUTSIDE_GEOFENCE');
      }

      // Check if late
      const isLate = this.isLate(time);

      const attendance = await Attendance.create({
        employeeId: finalEmployeeId,
        date,
        punchInTime: time,
        punchInLocation: {
          latitude,
          longitude,
          address: address || `Lat: ${latitude}, Lon: ${longitude}`,
        },
        punchInSelfie: selfie,
        deviceInfo,
        status: isLate ? 'Late' : 'Present',
        isLate,
      });

      return res.status(201).json({
        success: true,
        data: attendance,
        message: 'Punch in successful',
      });
    } catch (error) {
      next(error);
    }
  };

  punchOut = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { 
        employeeId, 
        latitude, 
        longitude, 
        address,
        selfie 
      } = req.body;
      
      // Get employeeId from authenticated user if not provided in request body
      const finalEmployeeId = employeeId || (req as any).user?.employeeId;
      
      if (!finalEmployeeId) {
        throw new AppError('Employee ID is required. Please ensure your user account has an employee ID assigned.', 400, 'EMPLOYEE_ID_REQUIRED');
      }
      
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      const time = new Date().toTimeString().slice(0, 8);

      const attendance = await Attendance.findOne({ employeeId: finalEmployeeId, date });

      if (!attendance) {
        throw new AppError('No punch in record found for today', 404, 'NO_PUNCH_IN');
      }

      attendance.punchOutTime = time;
      attendance.punchOutLocation = {
        latitude,
        longitude,
        address: address || `Lat: ${latitude}, Lon: ${longitude}`,
      };
      attendance.punchOutSelfie = selfie;
      
      if (attendance.punchInTime) {
        attendance.totalHours = this.calculateTotalHours(attendance.punchInTime, time);
      }
      
      await attendance.save();

      return res.status(200).json({
        success: true,
        data: attendance,
        message: 'Punch out successful',
      });
    } catch (error) {
      next(error);
    }
  };

  getTodayAttendance = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { employeeId } = req.params;
      const date = new Date();
      date.setHours(0, 0, 0, 0);

      const attendance = await Attendance.findOne({ employeeId, date });

      return res.status(200).json({
        success: true,
        data: attendance,
        message: 'Today attendance retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeAttendance = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { employeeId } = req.params;
      const { page = 1, pageSize = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(pageSize);

      const [items, total] = await Promise.all([
        Attendance.find({ employeeId })
          .sort({ date: -1 })
          .skip(skip)
          .limit(Number(pageSize)),
        Attendance.countDocuments({ employeeId })
      ]);

      return res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            page: Number(page),
            pageSize: Number(pageSize),
            total,
            totalPages: Math.ceil(total / Number(pageSize)),
          },
        },
        message: 'Employee attendance retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Get attendance summary for a date range
  getAttendanceSummary = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { startDate, endDate } = req.query;
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      const summary = await Attendance.aggregate([
        {
          $match: {
            date: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      return res.status(200).json({
        success: true,
        data: summary,
        message: 'Attendance summary retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Get all employees attendance for a specific date (for HR manager)
  getAllEmployeesAttendance = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { date } = req.query;
      const queryDate = date ? new Date(date as string) : new Date();
      queryDate.setHours(0, 0, 0, 0);

      const attendance = await Attendance.find({ date: queryDate })
        .populate('userId', 'name email employeeId department')
        .sort({ employeeId: 1, punchInTime: 1 });

      return res.status(200).json({
        success: true,
        data: attendance,
        message: 'All employees attendance retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Get employee attendance for last 2 months
  getEmployeeTwoMonthAttendance = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { employeeId } = req.params;
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 2);
      startDate.setHours(0, 0, 0, 0);

      const attendance = await Attendance.find({
        employeeId,
        date: { $gte: startDate, $lte: endDate }
      })
        .populate('userId', 'name email employeeId department')
        .sort({ date: -1 });

      return res.status(200).json({
        success: true,
        data: attendance,
        message: 'Employee 2-month attendance retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Download attendance report as PDF
  downloadAttendanceReport = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { employeeId } = req.params;
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 2);

      const attendance = await Attendance.find({
        employeeId,
        date: { $gte: startDate, $lte: endDate }
      })
        .populate('userId', 'name email employeeId department')
        .sort({ date: -1 });

      // TODO: Generate PDF using a library like pdfkit or puppeteer
      // For now, return JSON data
      return res.status(200).json({
        success: true,
        data: attendance,
        message: 'Attendance report data retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Send attendance report via email
  sendAttendanceReportEmail = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { employeeId } = req.params;
      const { emailType = 'user' } = req.body;
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 2);

      const attendance = await Attendance.find({
        employeeId,
        date: { $gte: startDate, $lte: endDate }
      })
        .populate('userId', 'name email employeeId department')
        .sort({ date: -1 });

      const employee = attendance[0]?.userId;
      if (!employee) {
        throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
      }

      let recipientName: string;
      let recipientEmail: string;
      let recipientType: string;

      if (emailType === 'admin') {
        // Get admin email from environment
        recipientEmail = process.env.ADMIN_EMAIL || 'gunnikij1665@gmail.com';
        recipientName = 'Admin';
        recipientType = 'admin';
      } else {
        // Send to employee email
        if (!(employee as any).email) {
          throw new AppError('Employee email not found', 404, 'EMAIL_NOT_FOUND');
        }
        recipientEmail = (employee as any).email;
        recipientName = (employee as any).name || 'Employee';
        recipientType = 'employee';
      }

      // Send email using the email service
      await emailService.sendAttendanceReport(
        recipientEmail,
        recipientName,
        employeeId,
        attendance,
        { startDate, endDate }
      );

      return res.status(200).json({
        success: true,
        message: `Attendance report sent successfully to ${recipientType} email`,
        data: {
          recipientEmail,
          recipientType,
          employeeId,
          reportPeriod: {
            startDate,
            endDate
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  private calculateTotalHours(punchIn: string, punchOut: string): number {
    const [inHours, inMinutes] = punchIn.split(':').map(Number);
    const [outHours, outMinutes] = punchOut.split(':').map(Number);

    const inTotalMinutes = inHours * 60 + inMinutes;
    const outTotalMinutes = outHours * 60 + outMinutes;

    const diffMinutes = outTotalMinutes - inTotalMinutes;
    return Math.round((diffMinutes / 60) * 100) / 100;
  }
}
