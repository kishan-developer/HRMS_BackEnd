import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { Device } from '../models/device.model';
import { User } from '../models/user.model';
import { Attendance } from '../models/attendance.model';

// Push Notification - Register Device
export const registerDevice = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).userId;
    const { deviceType, deviceName, os, appVersion } = req.body;

    // Check if device already registered
    const existingDevice = await Device.findOne({ userId, deviceType: 'mobile' });
    
    if (existingDevice) {
      // Update existing device
      existingDevice.name = deviceName || existingDevice.name;
      existingDevice.userAgent = req.headers['user-agent'] || '';
      existingDevice.lastUsed = new Date();
      await existingDevice.save();
      
      return res.json({
        success: true,
        data: existingDevice,
        message: 'Device updated successfully',
      });
    }

    // Create new device
    const device = await Device.create({
      userId,
      name: deviceName || 'Mobile Device',
      deviceType: deviceType || 'mobile',
      browser: appVersion,
      os: os,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      lastUsed: new Date(),
      isTrusted: true,
    });

    return res.json({
      success: true,
      data: device,
      message: 'Device registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Push Notification - Unregister Device
export const unregisterDevice = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).userId;

    const device = await Device.findOneAndUpdate(
      { userId, deviceType: 'mobile' },
      { isBlocked: true },
      { new: true }
    );

    if (!device) {
      throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
    }

    return res.json({
      success: true,
      message: 'Device unregistered successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Push Notification - Send Push
export const sendPushNotification = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      throw new AppError('User IDs array is required', 400, 'MISSING_USER_IDS');
    }

    // Get devices for all users
    const devices = await Device.find({
      userId: { $in: userIds },
      deviceType: 'mobile',
      isBlocked: false,
    });

    if (devices.length === 0) {
      throw new AppError('No active devices found', 404, 'NO_DEVICES');
    }

    // TODO: Implement actual FCM push notification here
    // This would use firebase-admin to send notifications
    
    return res.json({
      success: true,
      message: `Push notification sent to ${devices.length} devices`,
      data: {
        devicesSent: devices.length,
        userIds,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Registered Devices
export const getRegisteredDevices = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { userId } = req.params;

    const devices = await Device.find({ userId, isBlocked: false })
      .sort({ lastUsed: -1 })
      .limit(10);

    return res.json({
      success: true,
      data: devices,
    });
  } catch (error) {
    next(error);
  }
};

// GPS Location - Verify Location
export const verifyLocation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude are required', 400, 'MISSING_COORDINATES');
    }

    // TODO: Implement actual geofencing logic here
    // This would check if the location is within allowed office locations
    
    // For now, just return success
    return res.json({
      success: true,
      data: {
        isWithinAllowedArea: true,
        distance: 0,
        nearestLocation: 'Office',
      },
      message: 'Location verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// GPS Location - Get Allowed Locations
export const getAllowedLocations = async (_req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // TODO: Implement actual allowed locations from database
    // For now, return sample data
    const allowedLocations = [
      {
        id: '1',
        name: 'Main Office',
        latitude: 19.0760,
        longitude: 72.8777,
        radius: 100, // meters
        address: '123 Business Park, Mumbai',
      },
      {
        id: '2',
        name: 'Branch Office',
        latitude: 28.6139,
        longitude: 77.2090,
        radius: 100,
        address: '456 Tech Hub, Delhi',
      },
    ];

    return res.json({
      success: true,
      data: allowedLocations,
    });
  } catch (error) {
    next(error);
  }
};

// GPS Location - Add Allowed Location
export const addAllowedLocation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { name, latitude, longitude, radius, address } = req.body;

    // TODO: Implement actual database storage for allowed locations
    
    return res.json({
      success: true,
      data: {
        id: new Date().getTime().toString(),
        name,
        latitude,
        longitude,
        radius: radius || 100,
        address,
      },
      message: 'Allowed location added successfully',
    });
  } catch (error) {
    next(error);
  }
};

// GPS Location - Remove Allowed Location
export const removeAllowedLocation = async (_req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // TODO: Implement actual database removal
    
    return res.json({
      success: true,
      message: 'Allowed location removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// GPS Location - Check In with Location
export const checkInWithLocation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).userId;
    const { latitude, longitude, address, selfie } = req.body;

    console.log('=== CHECK-IN WITH LOCATION ===');
    console.log('UserId:', userId);
    console.log('Request body:', { latitude, longitude, address, hasSelfie: !!selfie });
    console.log('==============================');

    // Verify location first
    // TODO: Implement actual geofencing verification

    // Use the existing check-in logic
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for userId:', userId);
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    console.log('User found:', user.email, 'Employee ID:', user.employeeId);

    const now = new Date();
    const checkInTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for recent check-in from same location (30-minute cooldown)
    const recentAttendance = await Attendance.findOne({
      userId,
      date: today,
      punchInLocation: { $exists: true },
    }).sort({ createdAt: -1 });

    if (recentAttendance && recentAttendance.punchInLocation) {
      const lastLocation = recentAttendance.punchInLocation;
      const lastCheckInTime = new Date(recentAttendance.createdAt);
      const timeDiff = now.getTime() - lastCheckInTime.getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      // Calculate distance between locations (in meters)
      const distance = calculateDistance(
        latitude,
        longitude,
        lastLocation.latitude,
        lastLocation.longitude
      );

      console.log('Last check-in:', lastCheckInTime, 'minutes ago:', minutesDiff.toFixed(2));
      console.log('Distance from last location:', distance.toFixed(2), 'meters');

      // If same location (within 50 meters) and less than 30 minutes, prevent check-in
      if (distance < 50 && minutesDiff < 30) {
        const remainingMinutes = (30 - minutesDiff).toFixed(0);
        console.error('Too soon to check in from same location');
        throw new AppError(
          `Please wait ${remainingMinutes} minutes before checking in again from this location`,
          400,
          'TOO_SOON_SAME_LOCATION'
        );
      }
    }

    // Allow multiple check-ins per day - create new attendance record
    const attendance = await Attendance.create({
      userId,
      employeeId: user.employeeId,
      date: today,
      punchInTime: checkInTime,
      punchInLocation: { latitude, longitude, address },
      punchInSelfie: selfie,
      status: 'Present',
      shiftId: user.shiftId,
    });

    console.log('Attendance created:', attendance._id);

    return res.json({
      success: true,
      data: attendance,
      message: 'Checked in successfully',
    });
  } catch (error) {
    console.error('Check-in error:', error);
    next(error);
  }
};

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// GPS Location - Check Out with Location
export const checkOutWithLocation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = (req as any).userId;
    const { latitude, longitude, address, selfie } = req.body;

    console.log('=== CHECK-OUT WITH LOCATION ===');
    console.log('UserId:', userId);
    console.log('Request body:', { latitude, longitude, address, hasSelfie: !!selfie });
    console.log('==============================');

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find the most recent check-in without a check-out
    const attendance = await Attendance.findOne({
      userId,
      date: today,
      punchInTime: { $exists: true },
      punchOutTime: { $exists: false },
    }).sort({ createdAt: -1 });

    if (!attendance) {
      throw new AppError('No active check-in record found. Please check in first.', 404, 'NO_CHECK_IN');
    }

    console.log('Found attendance record:', attendance._id);

    const now = new Date();
    const checkOutTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const checkInDate = new Date(`2000-01-01 ${attendance.punchInTime}`);
    const checkOutDate = new Date(`2000-01-01 ${checkOutTime}`);
    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    const totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

    attendance.punchOutTime = checkOutTime;
    attendance.punchOutLocation = { latitude, longitude, address };
    attendance.punchOutSelfie = selfie;
    attendance.totalHours = parseFloat(totalHours);
    attendance.status = 'Present';

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

// Offline Sync - Get Pending Actions
export const getPendingActions = async (_req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // TODO: Implement actual pending actions from database
    // For now, return empty array
    return res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    next(error);
  }
};

// Offline Sync - Upload Offline Data
export const uploadOfflineData = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { actions } = req.body;

    // TODO: Implement actual offline data processing
    // This would process each action (check-in, check-out, leave request, etc.)
    
    return res.json({
      success: true,
      message: 'Offline data uploaded successfully',
      data: {
        processed: actions?.length || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Offline Sync - Get Last Sync Timestamp
export const getLastSyncTimestamp = async (_req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {

    // TODO: Implement actual last sync timestamp from database
    return res.json({
      success: true,
      data: {
        lastSync: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Offline Sync - Mark Sync Complete
export const markSyncComplete = async (_req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {

    // TODO: Implement actual sync completion marking
    
    return res.json({
      success: true,
      message: 'Sync marked as complete',
    });
  } catch (error) {
    next(error);
  }
};

// Offline Sync - Get Offline Data
export const getOfflineData = async (_req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {

    // TODO: Implement actual offline data retrieval
    // This would return data needed for offline mode (shifts, holidays, etc.)
    
    return res.json({
      success: true,
      data: {
        shifts: [],
        holidays: [],
        leaveTypes: [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Mobile Dashboard - Get Employee Dashboard
export const getEmployeeDashboard = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.findOne({ userId, date: today });

    // Get this month's stats
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthlyAttendance = await Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    });

    const dashboard = {
      user: {
        name: (user as any).name || 'Unknown',
        email: user.email,
        employeeId: (user as any).employeeId,
        department: (user as any).department,
      },
      today: {
        status: todayAttendance?.status || 'Not Checked In',
        checkInTime: todayAttendance?.punchInTime || null,
        checkOutTime: todayAttendance?.punchOutTime || null,
        totalHours: todayAttendance?.totalHours || 0,
        isLate: todayAttendance?.isLate || false,
      },
      monthly: {
        presentDays: monthlyAttendance.filter(a => a.status === 'Present').length,
        absentDays: monthlyAttendance.filter(a => a.status === 'Absent').length,
        leaveDays: monthlyAttendance.filter(a => a.status === 'Leave').length,
        totalHours: monthlyAttendance.reduce((sum, a) => sum + (a.totalHours || 0), 0),
        totalOvertime: monthlyAttendance.reduce((sum, a) => sum + (parseFloat(a.overtimeHours?.toString() || '0')), 0),
      },
    };

    return res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

// Mobile Dashboard - Get HR Manager Dashboard
export const getHRManagerDashboard = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.find({ date: today });

    // Get this month's stats
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthlyAttendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    });

    const dashboard = {
      today: {
        totalEmployees: await User.countDocuments({ role: 'employee' }),
        present: todayAttendance.filter(a => a.status === 'Present').length,
        absent: todayAttendance.filter(a => a.status === 'Absent').length,
        onLeave: todayAttendance.filter(a => a.status === 'Leave').length,
        late: todayAttendance.filter(a => a.isLate).length,
      },
      monthly: {
        presentDays: monthlyAttendance.filter(a => a.status === 'Present').length,
        absentDays: monthlyAttendance.filter(a => a.status === 'Absent').length,
        leaveDays: monthlyAttendance.filter(a => a.status === 'Leave').length,
      },
    };

    return res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

// Mobile Dashboard - Get Mobile Stats
export const getMobileStats = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { userId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0);
    const todayAttendance = await Attendance.findOne({ userId, date: today });

    const stats = {
      todayStatus: todayAttendance?.status || 'Not Checked In',
      checkInTime: todayAttendance?.punchInTime || null,
      checkOutTime: todayAttendance?.punchOutTime || null,
      workingHours: todayAttendance?.totalHours || 0,
      isLate: todayAttendance?.isLate || false,
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Mobile Attendance - Get Today Status
export const getTodayStatus = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { userId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({ userId, date: today });

    return res.json({
      success: true,
      data: attendance || {
        status: 'Not Checked In',
        checkInTime: null,
        checkOutTime: null,
        totalHours: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Mobile Attendance - Get Weekly Summary
export const getWeeklySummary = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { userId } = req.params;

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      userId,
      date: { $gte: startOfWeek, $lte: endOfWeek },
    });

    const summary = {
      presentDays: attendance.filter(a => a.status === 'Present').length,
      absentDays: attendance.filter(a => a.status === 'Absent').length,
      leaveDays: attendance.filter(a => a.status === 'Leave').length,
      totalHours: attendance.reduce((sum, a) => sum + (a.totalHours || 0), 0),
      lateDays: attendance.filter(a => a.isLate).length,
    };

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// Mobile Attendance - Get Monthly Summary
export const getMonthlySummary = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
    // Frontend sends 1-based month (January = 1). Convert to 0-based for Date constructor.
    const currentMonth = month ? parseInt(month as string) - 1 : new Date().getMonth();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    const attendance = await Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    });

    const summary = {
      presentDays: attendance.filter(a => a.status === 'Present').length,
      absentDays: attendance.filter(a => a.status === 'Absent').length,
      leaveDays: attendance.filter(a => a.status === 'Leave').length,
      totalHours: attendance.reduce((sum, a) => sum + (a.totalHours || 0), 0),
      totalOvertime: attendance.reduce((sum, a) => sum + (parseFloat(a.overtimeHours?.toString() || '0')), 0),
      lateDays: attendance.filter(a => a.isLate).length,
    };

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// Mobile Leave - Get My Leave Balance
export const getMyLeaveBalance = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { userId } = req.params;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const { LeaveBalance } = require('../models/leave-balance.model');
    
    let leaveBalance = await LeaveBalance.findOne({ userId, year });

    if (!leaveBalance) {
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

// Mobile Leave - Get Upcoming Holidays
export const getUpcomingHolidays = async (_req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // TODO: Implement actual holiday retrieval from database
    const today = new Date();
    const holidays = [
      {
        id: '1',
        name: 'Independence Day',
        date: new Date(today.getFullYear(), 7, 15),
        type: 'National Holiday',
      },
      {
        id: '2',
        name: 'Republic Day',
        date: new Date(today.getFullYear(), 0, 26),
        type: 'National Holiday',
      },
    ];

    return res.json({
      success: true,
      data: holidays,
    });
  } catch (error) {
    next(error);
  }
};

// Mobile Payslip - Get Recent Payslips
export const getRecentPayslips = async (_req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // TODO: Implement actual payslip retrieval from database
    const payslips: any[] = [];

    return res.json({
      success: true,
      data: payslips,
    });
  } catch (error) {
    next(error);
  }
};

// Mobile Payslip - Download Payslip PDF
export const downloadPayslipPDF = async (_req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // TODO: Implement actual PDF download
    return res.json({
      success: true,
      message: 'PDF download endpoint',
    });
  } catch (error) {
    next(error);
  }
};

// Mobile Attendance - Get Detailed Attendance Records
export const getAttendanceRecords = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;
    
    const selectedMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const selectedYear = year ? parseInt(year as string) : new Date().getFullYear();
    
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0);
    endDate.setHours(23, 59, 59, 999);
    
    const attendanceRecords = await Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1, punchInTime: -1 });
    
    return res.json({
      success: true,
      data: attendanceRecords,
      message: 'Attendance records retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};
