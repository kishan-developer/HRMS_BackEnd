import { Request, Response } from "express";
import RealtimeAttendance from "../models/realtime-attendance.model";
import { getAttendanceSocket } from "../config/socket.config";

/**
 * Test endpoint to debug Realtime Software data format
 */
export const testRealtimeEndpoint = (req: Request, res: Response) => {
  console.log("=== Realtime Software Test Endpoint ===");
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Query:", JSON.stringify(req.query, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("========================================");

  return res.json({
    success: true,
    message: "Test endpoint received data",
    headers: req.headers,
    query: req.query,
    body: req.body
  });
};

/**
 * Receive attendance data from Realtime Software
 */
export const receiveRealtimeAttendance = async (req: Request, res: Response) => {
  try {
    const {
      employee_code,
      log_datetime,
      log_time,
      downloaded_at,
      device_sn
    } = req.body;

    // Validate required fields
    if (!employee_code || !log_datetime || !log_time || !downloaded_at || !device_sn) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        required: ["employee_code", "log_datetime", "log_time", "downloaded_at", "device_sn"]
      });
    }

    // Check for duplicate
    const existing = await RealtimeAttendance.findOne({
      employee_code,
      log_datetime,
      device_sn
    });

    if (existing) {
      console.log(`Duplicate attendance record: ${employee_code} at ${log_datetime}`);
      return res.json({
        success: true,
        message: "Duplicate record - already exists",
        duplicate: true
      });
    }

    // Parse log_datetime to Date object for easier querying
    const parsedLogDateTime = new Date(log_datetime.replace(" ", "T"));

    // Create attendance record
    const attendance = await RealtimeAttendance.create({
      employee_code,
      log_datetime,
      log_time,
      downloaded_at,
      device_sn,
      parsedLogDateTime,
      processed: false,
      syncStatus: "synced"
    });

    console.log(`Received attendance: ${employee_code} at ${log_datetime} from device ${device_sn}`);

    // Emit real-time update via Socket.IO
    const socket = getAttendanceSocket();
    if (socket) {
      socket.emit("realtime:attendance:new", {
        _id: attendance._id,
        employee_code,
        log_datetime,
        log_time,
        device_sn,
        receivedAt: new Date()
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance received successfully",
      data: attendance
    });
  } catch (error: any) {
    console.error("Error receiving Realtime attendance:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.json({
        success: true,
        message: "Duplicate record - already exists",
        duplicate: true
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get all Realtime attendance records
 */
export const getRealtimeAttendance = async (req: Request, res: Response) => {
  try {
    const {
      employee_code,
      device_sn,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const filter: any = {};

    if (employee_code) filter.employee_code = employee_code;
    if (device_sn) filter.device_sn = device_sn;

    if (startDate && endDate) {
      filter.parsedLogDateTime = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [attendance, total] = await Promise.all([
      RealtimeAttendance.find(filter)
        .sort({ parsedLogDateTime: -1 })
        .skip(skip)
        .limit(Number(limit)),
      RealtimeAttendance.countDocuments(filter)
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
  } catch (error: any) {
    console.error("Error fetching Realtime attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get Realtime attendance statistics
 */
export const getRealtimeStats = async (_req: Request, res: Response) => {
  try {
    const stats = await RealtimeAttendance.aggregate([
      {
        $group: {
          _id: "$employee_code",
          totalPunches: { $sum: 1 },
          firstPunch: { $min: "$parsedLogDateTime" },
          lastPunch: { $max: "$parsedLogDateTime" },
          devices: { $addToSet: "$device_sn" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const totalRecords = await RealtimeAttendance.countDocuments();
    const uniqueEmployees = await RealtimeAttendance.distinct("employee_code");
    const uniqueDevices = await RealtimeAttendance.distinct("device_sn");

    return res.json({
      success: true,
      data: {
        totalRecords,
        uniqueEmployees: uniqueEmployees.length,
        uniqueDevices: uniqueDevices.length,
        employeeStats: stats
      }
    });
  } catch (error: any) {
    console.error("Error fetching Realtime stats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
