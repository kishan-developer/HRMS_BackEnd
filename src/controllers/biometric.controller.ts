import { Request, Response, NextFunction } from 'express';
import { BiometricDevice } from '../models/biometric-device.model';
import biometricService from '../services/biometric.service';
import { AppError } from '../middleware/error.middleware';

// Register a new biometric device
export const registerDevice = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const {
      name,
      brand,
      deviceModel,
      deviceId,
      ipAddress,
      port,
      gateway,
      serialNumber,
      cloudId,
      location,
      branchId,
      companyId,
      syncInterval,
      protocol,
    } = req.body;

    // Check if device ID or serial number already exists
    const existingDevice = await BiometricDevice.findOne({
      $or: [{ deviceId }, { serialNumber }],
    });

    if (existingDevice) {
      throw new AppError('Device ID or Serial Number already exists', 400, 'DEVICE_EXISTS');
    }

    const device = await BiometricDevice.create({
      name,
      brand,
      deviceModel,
      deviceId,
      ipAddress,
      port,
      gateway,
      serialNumber,
      cloudId,
      location,
      branchId,
      companyId,
      syncInterval: syncInterval || 30,
      protocol: protocol || 'zkteco',
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      data: device,
      message: 'Biometric device registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get all biometric devices
export const getAllDevices = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { companyId, branchId, isActive } = req.query;
    
    const query: any = {};
    if (companyId) query.companyId = companyId;
    if (branchId) query.branchId = branchId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const devices = await BiometricDevice.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: devices,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single biometric device
export const getDevice = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { deviceId } = req.params;

    const device = await BiometricDevice.findOne({ deviceId });

    if (!device) {
      throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
    }

    return res.json({
      success: true,
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

// Update biometric device
export const updateDevice = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { deviceId } = req.params;
    const updates = req.body;

    const device = await BiometricDevice.findOneAndUpdate(
      { deviceId },
      updates,
      { new: true, runValidators: true }
    );

    if (!device) {
      throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
    }

    return res.json({
      success: true,
      data: device,
      message: 'Device updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Delete biometric device
export const deleteDevice = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { deviceId } = req.params;

    const device = await BiometricDevice.findOne({ deviceId });

    if (!device) {
      throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
    }

    // Disconnect if connected
    await biometricService.disconnectDevice(deviceId);

    await BiometricDevice.deleteOne({ deviceId });

    return res.json({
      success: true,
      message: 'Device deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Connect to device
export const connectDevice = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { deviceId } = req.params;

    const result = await biometricService.connectDevice(deviceId);

    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
      });
    } else {
      throw new AppError(result.message, 400, 'CONNECTION_FAILED');
    }
  } catch (error) {
    next(error);
  }
};

// Disconnect from device
export const disconnectDevice = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { deviceId } = req.params;

    await biometricService.disconnectDevice(deviceId);

    return res.json({
      success: true,
      message: 'Device disconnected successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Test device connection
export const testConnection = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { deviceId } = req.params;

    const result = await biometricService.testConnection(deviceId);

    return res.json({
      success: result.success,
      message: result.message,
      info: result.info,
    });
  } catch (error) {
    next(error);
  }
};

// Sync attendance from device
export const syncAttendance = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { deviceId } = req.params;

    const result = await biometricService.syncAttendance(deviceId);

    return res.json({
      success: result.success,
      data: result,
      message: result.success 
        ? `Sync completed: ${result.newAttendances} new attendances processed`
        : 'Sync failed',
    });
  } catch (error) {
    next(error);
  }
};

// Get attendance logs from device (without syncing)
export const getDeviceLogs = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { deviceId } = req.params;

    const logs = await biometricService.getAttendanceLogs(deviceId);

    return res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// Get users from device
export const getDeviceUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { deviceId } = req.params;

    const users = await biometricService.getDeviceUsers(deviceId);

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Get device info
export const getDeviceInfo = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { deviceId } = req.params;

    const result = await biometricService.getDeviceInfo(deviceId);

    return res.json({
      success: result.success,
      data: result.info,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// Manual sync for specific date range
export const syncAttendanceByRange = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { deviceId } = req.params;

    // For now, just call the regular sync
    // In a more advanced implementation, you might filter logs by date range
    const result = await biometricService.syncAttendance(deviceId);

    return res.json({
      success: result.success,
      data: result,
      message: result.success 
        ? `Sync completed: ${result.newAttendances} new attendances processed`
        : 'Sync failed',
    });
  } catch (error) {
    next(error);
  }
};

// Bulk sync from all active devices
export const syncAllDevices = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { companyId, branchId } = req.query;

    const query: any = { isActive: true };
    if (companyId) query.companyId = companyId;
    if (branchId) query.branchId = branchId;

    const devices = await BiometricDevice.find(query);

    const results: any[] = [];

    for (const device of devices) {
      try {
        const result = await biometricService.syncAttendance(device.deviceId);
        results.push({
          deviceName: device.name,
          ...result,
        });
      } catch (error: any) {
        results.push({
          deviceId: device.deviceId,
          deviceName: device.name,
          success: false,
          error: error.message,
          newAttendances: 0,
        });
      }
    }

    const totalNewAttendances = results.reduce((sum, r) => sum + (r.newAttendances || 0), 0);
    const successCount = results.filter(r => r.success).length;

    return res.json({
      success: true,
      data: results,
      summary: {
        totalDevices: devices.length,
        successfulSyncs: successCount,
        failedSyncs: devices.length - successCount,
        totalNewAttendances,
      },
      message: `Bulk sync completed: ${successCount}/${devices.length} devices synced successfully`,
    });
  } catch (error) {
    next(error);
  }
};
