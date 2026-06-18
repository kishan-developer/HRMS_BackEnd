import ZKLib from 'zklib-js';
import { BiometricDevice } from '../models/biometric-device.model';
import { Attendance } from '../models/attendance.model';
import { User } from '../models/user.model';

interface AttendanceLog {
  userId: number;
  timestamp: number;
  deviceUserId: number;
  verifyMode: number;
  ioMode: number;
  workCode: number;
}

interface BiometricSyncResult {
  success: boolean;
  logsProcessed: number;
  newAttendances: number;
  errors: string[];
  deviceId: string;
}

class BiometricService {
  private connections: Map<string, ZKLib> = new Map();

  /**
   * Connect to a biometric device
   */
  async connectDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
    try {
      const device = await BiometricDevice.findOne({ deviceId, isActive: true });
      if (!device) {
        return { success: false, message: 'Device not found or inactive' };
      }

      // Disconnect if already connected
      if (this.connections.has(deviceId)) {
        await this.disconnectDevice(deviceId);
      }

      // Create new connection
      const zk = new ZKLib(
        device.ipAddress,
        device.port,
        10000,
        4000
      );

      await zk.createSocket();

      // Test connection
      await zk.getInfo();

      this.connections.set(deviceId, zk);

      // Update device status
      device.connectionStatus = 'connected';
      device.lastError = undefined;
      await device.save();

      return { success: true, message: 'Connected to device successfully' };
    } catch (error: any) {
      // Update device status with error
      const device = await BiometricDevice.findOne({ deviceId });
      if (device) {
        device.connectionStatus = 'error';
        device.lastError = error.message;
        await device.save();
      }

      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }

  /**
   * Disconnect from a biometric device
   */
  async disconnectDevice(deviceId: string): Promise<void> {
    try {
      const zk = this.connections.get(deviceId);
      if (zk) {
        await zk.disconnect();
        this.connections.delete(deviceId);

        const device = await BiometricDevice.findOne({ deviceId });
        if (device) {
          device.connectionStatus = 'disconnected';
          await device.save();
        }
      }
    } catch (error) {
      console.error(`Error disconnecting from device ${deviceId}:`, error);
    }
  }

  /**
   * Get attendance logs from device
   */
  async getAttendanceLogs(deviceId: string): Promise<AttendanceLog[]> {
    try {
      const zk = this.connections.get(deviceId);
      if (!zk) {
        throw new Error('Device not connected');
      }

      const logs = await zk.getAttendances();
      
      // Transform logs to standard format
      const attendanceLogs: AttendanceLog[] = logs.map((log: any) => ({
        userId: log.userId,
        timestamp: log.timestamp,
        deviceUserId: log.deviceUserId,
        verifyMode: log.verifyMode,
        ioMode: log.ioMode,
        workCode: log.workCode,
      }));

      return attendanceLogs;
    } catch (error: any) {
      throw new Error(`Failed to get attendance logs: ${error.message}`);
    }
  }

  /**
   * Get users from device
   */
  async getDeviceUsers(deviceId: string): Promise<any[]> {
    try {
      const zk = this.connections.get(deviceId);
      if (!zk) {
        throw new Error('Device not connected');
      }

      const users = await zk.getUsers();
      return users;
    } catch (error: any) {
      throw new Error(`Failed to get device users: ${error.message}`);
    }
  }

  /**
   * Sync attendance logs to database
   */
  async syncAttendance(deviceId: string): Promise<BiometricSyncResult> {
    const result: BiometricSyncResult = {
      success: false,
      logsProcessed: 0,
      newAttendances: 0,
      errors: [],
      deviceId,
    };

    try {
      // Connect if not already connected
      const connection = this.connections.get(deviceId);
      if (!connection) {
        const connectResult = await this.connectDevice(deviceId);
        if (!connectResult.success) {
          result.errors.push(connectResult.message);
          return result;
        }
      }

      const device = await BiometricDevice.findOne({ deviceId });
      if (!device) {
        result.errors.push('Device not found');
        return result;
      }

      // Get attendance logs
      const logs = await this.getAttendanceLogs(deviceId);
      result.logsProcessed = logs.length;

      // Process each log
      for (const log of logs) {
        try {
          // Find user by device user ID or employee ID
          const user = await User.findOne({ 
            $or: [
              { biometricUserId: log.userId.toString() },
              { employeeId: log.userId.toString() },
            ],
          });

          if (!user) {
            result.errors.push(`User not found for device user ID: ${log.userId}`);
            continue;
          }

          // Convert timestamp to date
          const logDate = new Date(log.timestamp * 1000); // Convert seconds to milliseconds
          const today = new Date(logDate);
          today.setHours(0, 0, 0, 0);

          // Check if attendance already exists for this date
          let attendance = await Attendance.findOne({
            userId: user._id.toString(),
            date: today,
          });

          const timeString = logDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });

          // Determine if it's check-in or check-out based on ioMode
          // ioMode: 0 = check-in, 1 = check-out (varies by device)
          const isCheckIn = log.ioMode === 0 || !attendance?.punchInTime;

          if (attendance) {
            if (isCheckIn && !attendance.punchInTime) {
              attendance.punchInTime = timeString;
              attendance.deviceInfo = {
                deviceId: device.deviceId,
                mobileModel: device.deviceModel,
                ipAddress: device.ipAddress,
                osVersion: device.protocol,
              };
              attendance.status = 'Present';
            } else if (!isCheckIn && !attendance.punchOutTime && attendance.punchInTime) {
              attendance.punchOutTime = timeString;
              
              // Calculate total hours
              const checkInDate = new Date(`2000-01-01 ${attendance.punchInTime}`);
              const checkOutDate = new Date(`2000-01-01 ${timeString}`);
              const diffMs = checkOutDate.getTime() - checkInDate.getTime();
              const totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
              attendance.totalHours = parseFloat(totalHours);

              // Calculate overtime (assuming 9 hours is standard)
              if (parseFloat(totalHours) > 9) {
                attendance.overtimeHours = parseFloat((parseFloat(totalHours) - 9).toFixed(2));
              }

              attendance.status = 'Present';
            }
            await attendance.save();
          } else {
            // Create new attendance record
            attendance = await Attendance.create({
              userId: user._id.toString(),
              employeeId: user.employeeId,
              date: today,
              punchInTime: isCheckIn ? timeString : undefined,
              punchOutTime: isCheckIn ? undefined : timeString,
              deviceInfo: {
                deviceId: device.deviceId,
                mobileModel: device.deviceModel,
                ipAddress: device.ipAddress,
                osVersion: device.protocol,
              },
              status: 'Present',
              shiftId: user.shiftId,
            });
            result.newAttendances++;
          }

          if (isCheckIn) {
            result.newAttendances++;
          }
        } catch (error: any) {
          result.errors.push(`Error processing log for user ${log.userId}: ${error.message}`);
        }
      }

      // Update last sync time
      device.lastSyncTime = new Date();
      device.connectionStatus = 'connected';
      await device.save();

      result.success = true;
    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);
      
      // Update device status with error
      const device = await BiometricDevice.findOne({ deviceId });
      if (device) {
        device.connectionStatus = 'error';
        device.lastError = error.message;
        await device.save();
      }
    }

    return result;
  }

  /**
   * Test device connection
   */
  async testConnection(deviceId: string): Promise<{ success: boolean; message: string; info?: any }> {
    try {
      const device = await BiometricDevice.findOne({ deviceId });
      if (!device) {
        return { success: false, message: 'Device not found' };
      }

      const zk = new ZKLib(device.ipAddress, device.port, 10000, 4000);
      await zk.createSocket();
      
      const info = await zk.getInfo();
      await zk.disconnect();

      return { 
        success: true, 
        message: 'Connection successful', 
        info 
      };
    } catch (error: any) {
      return { success: false, message: `Connection test failed: ${error.message}` };
    }
  }

  /**
   * Get device info
   */
  async getDeviceInfo(deviceId: string): Promise<{ success: boolean; message: string; info?: any }> {
    try {
      const zk = this.connections.get(deviceId);
      if (!zk) {
        return { success: false, message: 'Device not connected' };
      }

      const info = await zk.getInfo();
      return { success: true, message: 'Device info retrieved', info };
    } catch (error: any) {
      return { success: false, message: `Failed to get device info: ${error.message}` };
    }
  }

  /**
   * Cleanup all connections
   */
  async cleanup(): Promise<void> {
    for (const deviceId of this.connections.keys()) {
      await this.disconnectDevice(deviceId);
    }
  }
}

export default new BiometricService();
