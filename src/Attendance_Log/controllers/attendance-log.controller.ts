import { Request, Response } from "express";
import AttendanceLog from "../models/attendance.model";
import DailyAttendance from "../models/daily-attendance.model";
import AttendanceDevice from "../models/device.model";
import AttendanceEmployee from "../models/employee.model";
import { getAttendanceSocket } from "../config/socket.config";

export interface SyncLog {
  biometricUserId: number;
  punchTime: Date;
  verifyMode: number;
  deviceId: number;
  branchId: string;
  companyId: string;
  deviceIp: string;
}

export const syncAttendance = async (req: Request, res: Response) => {
  try {
    const { logs } = req.body;

    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({
        success: false,
        message: "Invalid logs data"
      });
    }

    let syncedCount = 0;
    let skippedCount = 0;
    const errorLogs: any[] = [];

    for (const log of logs) {
      try {
        // Check for duplicate
        const exists = await AttendanceLog.findOne({
          biometricUserId: log.biometricUserId,
          punchTime: log.punchTime
        });

        if (exists) {
          skippedCount++;
          continue;
        }

        // Find employee by biometricUserId
        const employee = await AttendanceEmployee.findOne({
          biometricUserId: log.biometricUserId,
          companyId: log.companyId,
          branchId: log.branchId
        });

        if (!employee) {
          errorLogs.push({
            log,
            error: "Employee not found"
          });
          continue;
        }

        // Find device
        const device = await AttendanceDevice.findOne({
          deviceId: log.deviceId,
          companyId: log.companyId
        });

        // Create attendance log
        const attendance = await AttendanceLog.create({
          employeeId: employee._id,
          biometricUserId: log.biometricUserId,
          punchTime: log.punchTime,
          verifyMode: log.verifyMode,
          deviceId: device?._id,
          branchId: log.branchId,
          companyId: log.companyId,
          departmentId: employee.departmentId,
          source: "biometric",
          syncStatus: "synced"
        });

        // Emit real-time update
        const socket = getAttendanceSocket();
        if (socket) {
          socket.emit("attendance:new", {
            _id: attendance._id,
            employeeId: employee._id,
            employeeName: employee.name,
            employeeCode: employee.employeeCode,
            punchTime: attendance.punchTime,
            branchId: attendance.branchId,
            companyId: attendance.companyId
          });
        }

        syncedCount++;
      } catch (error) {
        errorLogs.push({
          log,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    // Update device last sync time
    if (logs.length > 0) {
      const deviceIp = logs[0].deviceIp;
      await AttendanceDevice.findOneAndUpdate(
        { ipAddress: deviceIp },
        { lastSyncAt: new Date(), status: "online" }
      );
    }

    return res.json({
      success: true,
      message: `Synced ${syncedCount} logs, skipped ${skippedCount} duplicates`,
      syncedCount,
      skippedCount,
      errorCount: errorLogs.length,
      errorLogs
    });
  } catch (error) {
    console.error("Error syncing attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getAttendanceLogs = async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      branchId,
      employeeId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const filter: any = {};

    if (companyId) filter.companyId = companyId;
    if (branchId) filter.branchId = branchId;
    if (employeeId) filter.employeeId = employeeId;
    if (startDate && endDate) {
      filter.punchTime = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AttendanceLog.find(filter)
        .populate("employeeId", "name employeeCode department")
        .populate("deviceId", "deviceName ipAddress")
        .sort({ punchTime: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AttendanceLog.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching attendance logs:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getDailyAttendance = async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      branchId,
      employeeId,
      date,
      page = 1,
      limit = 50
    } = req.query;

    const filter: any = {};

    if (companyId) filter.companyId = companyId;
    if (branchId) filter.branchId = branchId;
    if (employeeId) filter.employeeId = employeeId;
    if (date) {
      const dateObj = new Date(date as string);
      filter.date = {
        $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        $lte: new Date(dateObj.setHours(23, 59, 59, 999))
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [attendance, total] = await Promise.all([
      DailyAttendance.find(filter)
        .populate("employeeId", "name employeeCode department designation")
        .populate("deviceId", "deviceName ipAddress")
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      DailyAttendance.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: attendance,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching daily attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getDeviceStatus = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId } = req.query;

    const filter: any = {};
    if (companyId) filter.companyId = companyId;
    if (branchId) filter.branchId = branchId;

    const devices = await AttendanceDevice.find(filter);

    return res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    console.error("Error fetching device status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const registerDevice = async (req: Request, res: Response) => {
  try {
    const {
      branchId,
      deviceName,
      deviceId,
      ipAddress,
      port,
      serialNumber,
      companyId,
      location
    } = req.body;

    const device = await AttendanceDevice.create({
      branchId,
      deviceName,
      deviceId,
      ipAddress,
      port: port || 4370,
      serialNumber,
      companyId,
      location,
      status: "offline"
    });

    return res.status(201).json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error("Error registering device:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const registerEmployee = async (req: Request, res: Response) => {
  try {
    const {
      employeeCode,
      name,
      department,
      designation,
      biometricUserId,
      branchId,
      companyId,
      departmentId,
      shiftId
    } = req.body;

    const employee = await AttendanceEmployee.create({
      employeeCode,
      name,
      department,
      designation,
      biometricUserId,
      branchId,
      companyId,
      departmentId,
      shiftId,
      active: true
    });

    return res.status(201).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error("Error registering employee:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
