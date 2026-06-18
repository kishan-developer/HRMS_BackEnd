import { Request, Response } from "express";
import AttendanceLog from "../models/attendance.model";
import DailyAttendance from "../models/daily-attendance.model";
import AttendanceEmployee from "../models/employee.model";

export const calculateDailyAttendance = async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required"
      });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get all employees
    const employees = await AttendanceEmployee.find({ active: true });

    let processedCount = 0;

    for (const employee of employees) {
      // Get attendance logs for the day
      const logs = await AttendanceLog.find({
        employeeId: employee._id,
        punchTime: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ punchTime: 1 });

      if (logs.length === 0) {
        // Mark as absent
        await DailyAttendance.findOneAndUpdate(
          { employeeId: employee._id, date: startOfDay },
          {
            employeeId: employee._id,
            date: startOfDay,
            status: "absent",
            branchId: employee.branchId,
            companyId: employee.companyId,
            departmentId: employee.departmentId,
            workingHours: 0
          },
          { upsert: true, new: true }
        );
        continue;
      }

      // Calculate check-in and check-out
      const checkIn = logs[0].punchTime;
      const checkOut = logs[logs.length - 1].punchTime;

      // Calculate working hours in milliseconds
      const workingHoursMs = checkOut.getTime() - checkIn.getTime();
      const workingHours = workingHoursMs / (1000 * 60 * 60); // Convert to hours

      // Determine status based on working hours
      let status = "present";
      let lateMinutes = 0;
      let earlyExitMinutes = 0;
      let overtimeMinutes = 0;

      // Default shift: 9:00 AM to 6:00 PM (9 hours)
      const shiftStart = new Date(startOfDay);
      shiftStart.setHours(9, 0, 0, 0);

      const shiftEnd = new Date(startOfDay);
      shiftEnd.setHours(18, 0, 0, 0);

      // Check for late entry (after 9:15 AM)
      if (checkIn > shiftStart) {
        const lateMs = checkIn.getTime() - shiftStart.getTime();
        lateMinutes = Math.round(lateMs / (1000 * 60));
        if (lateMinutes > 15) {
          status = "late-entry";
        }
      }

      // Check for early exit (before 5:45 PM)
      if (checkOut < shiftEnd) {
        const earlyMs = shiftEnd.getTime() - checkOut.getTime();
        earlyExitMinutes = Math.round(earlyMs / (1000 * 60));
        if (earlyExitMinutes > 15) {
          status = "early-exit";
        }
      }

      // Check for overtime (after 6:30 PM)
      if (checkOut > shiftEnd) {
        const overtimeMs = checkOut.getTime() - shiftEnd.getTime();
        overtimeMinutes = Math.round(overtimeMs / (1000 * 60));
        if (overtimeMinutes > 30) {
          status = "overtime";
        }
      }

      // Check for half day (less than 4 hours)
      if (workingHours < 4) {
        status = "half-day";
      }

      // Update or create daily attendance record
      await DailyAttendance.findOneAndUpdate(
        { employeeId: employee._id, date: startOfDay },
        {
          employeeId: employee._id,
          date: startOfDay,
          checkIn,
          checkOut,
          workingHours: Math.round(workingHours * 100) / 100,
          status,
          branchId: employee.branchId,
          companyId: employee.companyId,
          departmentId: employee.departmentId,
          lateMinutes,
          earlyExitMinutes,
          overtimeMinutes,
          shiftId: employee.shiftId
        },
        { upsert: true, new: true }
      );

      processedCount++;
    }

    return res.json({
      success: true,
      message: `Processed attendance for ${processedCount} employees`,
      processedCount
    });
  } catch (error) {
    console.error("Error calculating daily attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getAttendanceReport = async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      branchId,
      departmentId,
      startDate,
      endDate
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }

    const filter: any = {
      date: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      }
    };

    if (companyId) filter.companyId = companyId;
    if (branchId) filter.branchId = branchId;
    if (departmentId) filter.departmentId = departmentId;

    const attendanceRecords = await DailyAttendance.find(filter)
      .populate("employeeId", "name employeeCode department designation")
      .sort({ date: -1, employeeId: 1 });

    // Calculate summary statistics
    const summary = {
      totalDays: 0,
      present: 0,
      absent: 0,
      halfDay: 0,
      lateEntry: 0,
      earlyExit: 0,
      overtime: 0,
      totalWorkingHours: 0
    };

    attendanceRecords.forEach((record: any) => {
      summary.totalDays++;
      summary.totalWorkingHours += record.workingHours || 0;

      switch (record.status) {
        case "present":
          summary.present++;
          break;
        case "absent":
          summary.absent++;
          break;
        case "half-day":
          summary.halfDay++;
          break;
        case "late-entry":
          summary.lateEntry++;
          break;
        case "early-exit":
          summary.earlyExit++;
          break;
        case "overtime":
          summary.overtime++;
          break;
      }
    });

    return res.json({
      success: true,
      data: attendanceRecords,
      summary
    });
  } catch (error) {
    console.error("Error generating attendance report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
