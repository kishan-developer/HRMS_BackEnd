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

// Get Attendance Summary (for HR Manager dashboard)
export const getAttendanceSummary = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({
      date: { $gte: start, $lte: end }
    });

    const summary = {
      totalEmployees: await User.countDocuments({ role: 'employee' }),
      presentToday: attendance.filter(a => a.date.toDateString() === new Date().toDateString() && a.status === 'Present').length,
      absentToday: attendance.filter(a => a.date.toDateString() === new Date().toDateString() && a.status === 'Absent').length,
      onLeaveToday: attendance.filter(a => a.date.toDateString() === new Date().toDateString() && a.status === 'Leave').length,
      lateToday: attendance.filter(a => a.date.toDateString() === new Date().toDateString() && a.isLate).length,
      presentThisMonth: attendance.filter(a => a.status === 'Present').length,
      absentThisMonth: attendance.filter(a => a.status === 'Absent').length,
      averageWorkingHours: attendance.length > 0 
        ? (attendance.reduce((sum, a) => sum + (a.totalHours || 0), 0) / attendance.length).toFixed(2)
        : 0,
    };

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// Get Hourly Punch Distribution
export const getHourlyPunchDistribution = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date as string) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({ date: queryDate });

    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      count: 0,
    }));

    attendance.forEach(a => {
      if (a.punchInTime) {
        const hour = parseInt(a.punchInTime.split(':')[0]);
        if (hour >= 0 && hour < 24) {
          hourlyDistribution[hour].count++;
        }
      }
    });

    return res.json({
      success: true,
      data: hourlyDistribution,
    });
  } catch (error) {
    next(error);
  }
};

// Get Department Attendance Breakdown
export const getDepartmentAttendance = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date as string) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const users = await User.find({ role: 'employee' });
    const departmentBreakdown: any = {};

    for (const user of users) {
      const dept = user.department || 'Unassigned';
      if (!departmentBreakdown[dept]) {
        departmentBreakdown[dept] = { total: 0, present: 0, absent: 0, late: 0 };
      }
      departmentBreakdown[dept].total++;

      const attendance = await Attendance.findOne({
        userId: user._id.toString(),
        date: queryDate,
      });

      if (attendance) {
        if (attendance.status === 'Present') departmentBreakdown[dept].present++;
        if (attendance.status === 'Absent') departmentBreakdown[dept].absent++;
        if (attendance.isLate) departmentBreakdown[dept].late++;
      }
    }

    const result = Object.entries(departmentBreakdown).map(([department, stats]: [string, any]) => ({
      department,
      ...stats,
      attendanceRate: stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0,
    }));

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get Recent Activities
export const getRecentActivities = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { limit = 20 } = req.query;

    const attendance = await Attendance.find()
      .populate('userId', 'name employeeId department')
      .sort({ date: -1, punchInTime: -1 })
      .limit(parseInt(limit as string));

    const activities = attendance.map(a => ({
      id: a._id,
      employeeName: (a.userId as any)?.name || 'Unknown',
      employeeId: (a.userId as any)?.employeeId || 'N/A',
      department: (a.userId as any)?.department || 'N/A',
      action: a.punchInTime ? (a.punchOutTime ? 'Checked Out' : 'Checked In') : 'Absent',
      time: a.punchInTime || a.punchOutTime || 'N/A',
      date: a.date,
      status: a.status,
      isLate: a.isLate,
    }));

    return res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

// Get Weekly Trend
export const getWeeklyTrend = async (_req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setHours(23, 59, 59, 999);

      const attendance = await Attendance.find({
        date: { $gte: date, $lte: nextDate }
      });

      weeklyData.push({
        day: days[date.getDay()],
        date: date.toISOString().split('T')[0],
        present: attendance.filter(a => a.status === 'Present').length,
        absent: attendance.filter(a => a.status === 'Absent').length,
        late: attendance.filter(a => a.isLate).length,
        total: attendance.length,
      });
    }

    return res.json({
      success: true,
      data: weeklyData,
    });
  } catch (error) {
    next(error);
  }
};
