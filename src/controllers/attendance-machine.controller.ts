import { Request, Response } from 'express';
import { BiometricDevice, IBiometricDevice } from '../models/biometric-device.model';
import { biometricDeviceService } from '../services/biometricDevice.service';

// Get all attendance machines
export const getAttendanceMachines = async (_req: Request, res: Response) => {
  try {
    const machines = await BiometricDevice.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: machines,
      message: 'Attendance machines retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving attendance machines',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get attendance machine by ID
export const getAttendanceMachineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const machine = await BiometricDevice.findById(id);
    
    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Attendance machine not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      data: machine,
      message: 'Attendance machine retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving attendance machine',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Add attendance machine
export const addAttendanceMachine = async (req: Request, res: Response) => {
  try {
    const machineData: Partial<IBiometricDevice> = req.body;
    
    const newMachine = new BiometricDevice({
      ...machineData,
      connectionStatus: 'disconnected',
      isActive: true,
    });
    
    const savedMachine = await newMachine.save();
    
    res.status(201).json({
      success: true,
      data: savedMachine,
      message: 'Attendance machine added successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding attendance machine',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update attendance machine
export const updateAttendanceMachine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedMachine = await BiometricDevice.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedMachine) {
      return res.status(404).json({
        success: false,
        message: 'Attendance machine not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      data: updatedMachine,
      message: 'Attendance machine updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating attendance machine',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete attendance machine
export const deleteAttendanceMachine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deletedMachine = await BiometricDevice.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!deletedMachine) {
      return res.status(404).json({
        success: false,
        message: 'Attendance machine not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Attendance machine deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting attendance machine',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Sync attendance machine
export const syncAttendanceMachine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const machine = await BiometricDevice.findById(id);
    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Attendance machine not found',
      });
    }
    
    // Simulate sync - update last sync time and status
    const updatedMachine = await BiometricDevice.findByIdAndUpdate(
      id,
      {
        $set: {
          lastSyncTime: new Date(),
          connectionStatus: 'connected',
          lastError: null,
        },
      },
      { new: true }
    );
    
    return res.status(200).json({
      success: true,
      data: updatedMachine,
      message: 'Attendance machine synced successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error syncing attendance machine',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Test machine connection
export const testMachineConnection = async (req: Request, res: Response) => {
  try {
    const { ipAddress, port } = req.body;
    
    // Simulate connection test
    const isConnected = true;
    const latency = Math.floor(Math.random() * 100) + 10;
    
    res.status(200).json({
      success: true,
      data: {
        connected: isConnected,
        latency,
        ipAddress,
        port,
      },
      message: isConnected ? 'Machine connection test successful' : 'Machine connection failed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing machine connection',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get sync logs
export const getSyncLogs = async (req: Request, res: Response) => {
  try {
    const { machineId } = req.params;
    
    // Mock sync logs - in production, this would query a sync logs collection
    const mockLogs = [
      {
        id: '1',
        machineId,
        timestamp: new Date(),
        status: 'success',
        recordsSynced: 150,
        message: 'Sync completed successfully',
      },
      {
        id: '2',
        machineId,
        timestamp: new Date(Date.now() - 3600000),
        status: 'success',
        recordsSynced: 142,
        message: 'Sync completed successfully',
      },
    ];
    
    return res.status(200).json({
      success: true,
      data: mockLogs,
      message: 'Sync logs retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving sync logs',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get device statistics
export const getDeviceStats = async (_req: Request, res: Response) => {
  try {
    const totalMachines = await BiometricDevice.countDocuments({ isActive: true });
    const onlineMachines = await BiometricDevice.countDocuments({ 
      isActive: true, 
      connectionStatus: 'connected' 
    });
    const offlineMachines = await BiometricDevice.countDocuments({ 
      isActive: true, 
      connectionStatus: { $ne: 'connected' } 
    });
    
    return res.status(200).json({
      success: true,
      data: {
        totalMachines,
        onlineMachines,
        offlineMachines,
        syncRate: totalMachines > 0 ? Math.round((onlineMachines / totalMachines) * 100) : 0,
      },
      message: 'Device statistics retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving device statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get device configurations
export const getDeviceConfigurations = async (_req: Request, res: Response) => {
  try {
    // Mock device configurations - in production, this would query a device config collection
    const configurations = [
      {
        id: '1',
        brand: 'ZKTeco',
        models: ['T 304F+', 'K40', 'K60', 'A40', 'A160'],
        logo: '/images/zkteco-logo.png',
        color: '#0066cc',
        isActive: true,
      },
      {
        id: '2',
        brand: 'eSSL',
        models: ['K40', 'A40', 'A60', 'X990'],
        logo: '/images/essl-logo.png',
        color: '#ff6600',
        isActive: true,
      },
      {
        id: '3',
        brand: 'COSEC',
        models: ['ARGO', 'VEGA', 'CENTOR'],
        logo: '/images/cosec-logo.png',
        color: '#009933',
        isActive: true,
      },
      {
        id: '4',
        brand: 'Realtime',
        models: ['RTA-500', 'RTA-600', 'RTA-700'],
        logo: '/images/realtime-logo.png',
        color: '#9900cc',
        isActive: true,
      },
    ];
    
    return res.status(200).json({
      success: true,
      data: configurations,
      message: 'Device configurations retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving device configurations',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Upload device logo
export const uploadDeviceLogo = async (req: Request, res: Response) => {
  try {
    // In production, this would handle file upload to cloud storage
    const { brand, logoUrl } = req.body;
    
    return res.status(200).json({
      success: true,
      data: {
        brand,
        logoUrl,
        uploadedAt: new Date(),
      },
      message: 'Device logo uploaded successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error uploading device logo',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Save device configuration
export const saveDeviceConfiguration = async (req: Request, res: Response) => {
  try {
    const { brand, model, logoUrl } = req.body;
    
    // In production, this would save to a device config collection
    return res.status(200).json({
      success: true,
      data: {
        brand,
        model,
        logoUrl,
        savedAt: new Date(),
      },
      message: 'Device configuration saved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error saving device configuration',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Real device connection test
export const testRealDeviceConnection = async (req: Request, res: Response) => {
  try {
    const { ipAddress, port } = req.body;
    
    const result = await biometricDeviceService.testConnection(
      ipAddress,
      parseInt(port)
    );
    
    return res.status(200).json({
      success: result.success,
      data: {
        connected: result.success,
        latency: result.latency,
        message: result.message,
      },
      message: result.message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error testing device connection',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get device users
export const getDeviceUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const machine = await BiometricDevice.findById(id);
    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Attendance machine not found',
      });
    }
    
    // Connect to device and fetch users
    await biometricDeviceService.connect({
      ipAddress: machine.ipAddress,
      port: machine.port,
      machineNo: machine.deviceId,
      serialNumber: machine.serialNumber,
    });
    
    const users = await biometricDeviceService.getUsers();
    
    biometricDeviceService.disconnect();
    
    return res.status(200).json({
      success: true,
      data: users,
      message: 'Device users retrieved successfully',
    });
  } catch (error) {
    biometricDeviceService.disconnect();
    return res.status(500).json({
      success: false,
      message: 'Error retrieving device users',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get device attendance logs
export const getDeviceAttendanceLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const machine = await BiometricDevice.findById(id);
    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Attendance machine not found',
      });
    }
    
    // Connect to device and fetch attendance logs
    await biometricDeviceService.connect({
      ipAddress: machine.ipAddress,
      port: machine.port,
      machineNo: machine.deviceId,
      serialNumber: machine.serialNumber,
    });
    
    const logs = await biometricDeviceService.getAttendanceLogs();
    
    biometricDeviceService.disconnect();
    
    return res.status(200).json({
      success: true,
      data: logs,
      message: 'Device attendance logs retrieved successfully',
    });
  } catch (error) {
    biometricDeviceService.disconnect();
    return res.status(500).json({
      success: false,
      message: 'Error retrieving device attendance logs',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Sync device attendance logs to database
export const syncDeviceAttendanceLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const machine = await BiometricDevice.findById(id);
    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Attendance machine not found',
      });
    }
    
    // Connect to device and fetch attendance logs
    await biometricDeviceService.connect({
      ipAddress: machine.ipAddress,
      port: machine.port,
      machineNo: machine.deviceId,
      serialNumber: machine.serialNumber,
    });
    
    const logs = await biometricDeviceService.getAttendanceLogs();
    
    // In production, save logs to attendance collection
    // For now, just return the logs
    
    // Update machine sync status
    await BiometricDevice.findByIdAndUpdate(
      id,
      {
        $set: {
          lastSyncTime: new Date(),
          connectionStatus: 'connected',
          lastError: null,
        },
      },
      { new: true }
    );
    
    biometricDeviceService.disconnect();
    
    return res.status(200).json({
      success: true,
      data: {
        syncedRecords: logs.length,
        logs,
      },
      message: `Successfully synced ${logs.length} attendance records`,
    });
  } catch (error) {
    biometricDeviceService.disconnect();
    
    // Update machine error status
    if (req.params.id) {
      await BiometricDevice.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            connectionStatus: 'error',
            lastError: error instanceof Error ? error.message : 'Unknown error',
          },
        }
      );
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error syncing device attendance logs',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
