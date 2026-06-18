import { Request, Response, NextFunction } from 'express';
import { Attendance } from '../models/attendance.model';
import { LeaveBalance } from '../models/leave-balance.model';
import { User } from '../models/user.model';
import { AppError } from '../middleware/error.middleware';

// Check In
export const checkIn = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).userId;
    const { latitude, longitude, address, selfie } = req.body;
    const deviceInfo = {
      deviceId: req.body.deviceId,
      mobileModel: req.body.mobileModel,
      ipAddress: req.ip,
      osVersion: req.body.osVersion,
    };

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingAttendance = await Attendance.findOne({
      userId,
      date: today,
    });

    if (existingAttendance && existingAttendance.punchInTime) {
      throw new AppError('Already checked in today', 400, 'ALREADY_CHECKED_IN');
    }

    const now = new Date();
    const checkInTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Create or update attendance record
    let attendance;
    if (existingAttendance) {
      attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id,
        {
          punchInTime: checkInTime,
          punchInLocation: { latitude, longitude, address },
          punchInSelfie: selfie,
          deviceInfo,
          status: 'Present',
        },
        { new: true }
      );
    } else {
      attendance = await Attendance.create({
        userId,
        employeeId: user.employeeId,
        date: today,
        punchInTime: checkInTime,
        punchInLocation: { latitude, longitude, address },
        punchInSelfie: selfie,
        deviceInfo,
        status: 'Present',
        shiftId: user.shiftId,
      });
    }

    return res.json({
      success: true,
      data: attendance,
      message: 'Checked in successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Check Out
export const checkOut = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).userId;
    const { latitude, longitude, address, selfie } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({
      userId,
      date: today,
    });

    if (!attendance || !attendance.punchInTime) {
      throw new AppError('No check-in record found for today', 404, 'NO_CHECK_IN');
    }

    if (attendance.punchOutTime) {
      throw new AppError('Already checked out today', 400, 'ALREADY_CHECKED_OUT');
    }

    const now = new Date();
    const checkOutTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Calculate working hours
    const checkInDate = new Date(`2000-01-01 ${attendance.punchInTime}`);
    const checkOutDate = new Date(`2000-01-01 ${checkOutTime}`);
    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    const totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

    attendance.punchOutTime = checkOutTime;
    attendance.punchOutLocation = { latitude, longitude, address };
    attendance.punchOutSelfie = selfie;
    attendance.totalHours = parseFloat(totalHours);
    attendance.status = 'Present';

    // Calculate overtime (assuming 9 hours is standard)
    if (parseFloat(totalHours) > 9) {
      attendance.overtimeHours = parseFloat((parseFloat(totalHours) - 9).toFixed(2));
    }

    await attendance.save();

    return res.json({
      success: true,
      data: attendance,
      message: 'Checked out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Start Break
export const startBreak = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({
      userId,
      date: today,
    });

    if (!attendance || !attendance.punchInTime) {
      throw new AppError('No check-in record found for today', 404, 'NO_CHECK_IN');
    }

    if (attendance.punchOutTime) {
      throw new AppError('Cannot start break after check out', 400, 'INVALID_BREAK');
    }

    // Check if there's an active break
    const activeBreak = attendance.breaks.find(b => !b.endTime);
    if (activeBreak) {
      throw new AppError('Break already in progress', 400, 'BREAK_IN_PROGRESS');
    }

    attendance.breaks.push({
      startTime: new Date(),
    });

    await attendance.save();

    return res.json({
      success: true,
      message: 'Break started successfully',
    });
  } catch (error) {
    next(error);
  }
};

// End Break
export const endBreak = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({
      userId,
      date: today,
    });

    if (!attendance || !attendance.punchInTime) {
      throw new AppError('No check-in record found for today', 404, 'NO_CHECK_IN');
    }

    const activeBreak = attendance.breaks.find(b => !b.endTime);
    if (!activeBreak) {
      throw new AppError('No active break found', 404, 'NO_ACTIVE_BREAK');
    }

    const endTime = new Date();
    const duration = endTime.getTime() - activeBreak.startTime.getTime();
    const durationMinutes = Math.round(duration / (1000 * 60));

    activeBreak.endTime = endTime;
    activeBreak.duration = durationMinutes;

    // Update total break time
    attendance.totalBreakTime = attendance.breaks.reduce((total, b) => total + (b.duration || 0), 0);

    await attendance.save();

    return res.json({
      success: true,
      message: 'Break ended successfully',
      data: { duration: durationMinutes },
    });
  } catch (error) {
    next(error);
  }
};

// Get Today's Attendance
export const getTodayAttendance = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({
      userId,
      date: today,
    });

    const user = await User.findById(userId);
    
    return res.json({
      success: true,
      data: {
        attendance,
        user,
        currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Attendance by Date Range
export const getAttendanceByRange = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).userId;
    const { startDate, endDate, status } = req.query;

    const query: any = { userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    if (status) {
      query.status = status;
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });

    return res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

// Get Attendance Statistics
export const getAttendanceStats = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).userId;
    const { month, year } = req.query;

    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month as string) : new Date().getMonth();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    const attendance = await Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    });

    const stats = {
      presentDays: attendance.filter(a => a.status === 'Present').length,
      absentDays: attendance.filter(a => a.status === 'Absent').length,
      leaveDays: attendance.filter(a => a.status === 'Leave').length,
      lateDays: attendance.filter(a => a.isLate).length,
      halfDays: attendance.filter(a => a.status === 'Half-Day').length,
      totalHours: attendance.reduce((sum, a) => sum + (a.totalHours || 0), 0),
      totalOvertime: attendance.reduce((sum, a) => sum + (parseFloat(a.overtimeHours?.toString() || '0')), 0),
      totalBreakTime: attendance.reduce((sum, a) => sum + (a.totalBreakTime || 0), 0),
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Get Leave Balance
export const getLeaveBalance = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).userId;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    let leaveBalance = await LeaveBalance.findOne({ userId, year });

    if (!leaveBalance) {
      // Create default leave balance for the year
      const user = await User.findById(userId);
      leaveBalance = await LeaveBalance.create({
        userId,
        employeeId: user?.employeeId,
        year,
        casualLeave: 12,
        sickLeave: 8,
        earnedLeave: 15,
        maternityLeave: 180,
        paternityLeave: 15,
        unpaidLeave: 0,
      });
    }

    return res.json({
      success: true,
      data: leaveBalance,
    });
  } catch (error) {
    next(error);
  }
};

// Get Monthly Attendance Calendar
export const getMonthlyCalendar = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).userId;
    const { month, year } = req.query;

    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month as string) : new Date().getMonth();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    const attendance = await Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    });

    const calendarData = attendance.map(a => ({
      date: a.date,
      status: a.status,
      isLate: a.isLate,
      checkInTime: a.punchInTime,
      checkOutTime: a.punchOutTime,
      totalHours: a.totalHours,
    }));

    return res.json({
      success: true,
      data: calendarData,
    });
  } catch (error) {
    next(error);
  }
};
