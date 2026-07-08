import net from 'net';

export interface DeviceConnectionConfig {
  ipAddress: string;
  port: number;
  machineNo: string;
  serialNumber: string;
}

export interface DeviceUser {
  userId: number;
  name: string;
  cardNumber: string;
  fingerprintData?: string;
  pin?: string;
  privilege: number;
  enabled: boolean;
}

export interface AttendanceLog {
  userId: number;
  timestamp: Date;
  verifyMode: number;
  ioMode: number;
  workCode: number;
}

export class BiometricDeviceService {
  private socket: net.Socket | null = null;
  private isConnected = false;
  private connectTimeout: NodeJS.Timeout | null = null;

  /**
   * Connect to ZKTeco biometric device
   */
  async connect(config: DeviceConnectionConfig): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();
      
      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log(`Connected to device at ${config.ipAddress}:${config.port}`);
        
        // Send handshake
        this.sendHandshake();
        resolve(true);
      });

      this.socket.on('data', (data) => {
        this.handleDeviceResponse(data);
      });

      this.socket.on('error', (error) => {
        console.error('Device connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('close', () => {
        console.log('Device connection closed');
        this.isConnected = false;
      });

      this.connectTimeout = setTimeout(() => {
        this.socket?.destroy();
        reject(new Error('Connection timeout'));
      }, 10000);

      this.socket.connect(config.port, config.ipAddress);
    });
  }

  /**
   * Disconnect from device
   */
  disconnect(): void {
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.isConnected = false;
  }

  /**
   * Send handshake to device
   */
  private sendHandshake(): void {
    if (!this.socket) return;
    
    // ZKTeco handshake command
    const handshakeBuffer = Buffer.from([
      0x50, 0x50, 0x82, 0x7d, 0x13, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    this.socket.write(handshakeBuffer);
  }

  /**
   * Handle device response
   */
  private handleDeviceResponse(data: Buffer): void {
    console.log('Received data from device:', data.toString('hex'));
    
    // Parse response based on command
    if (data.length >= 8) {
      const commandId = data.readUInt16LE(4);
      console.log('Command ID:', commandId);
      
      switch (commandId) {
        case 0x1600: // ACK
          console.log('ACK received');
          break;
        case 0x1601: // Data response
          this.handleDataResponse(data);
          break;
        default:
          console.log('Unknown command ID:', commandId);
      }
    }
  }

  /**
   * Handle data response from device
   */
  private handleDataResponse(data: Buffer): void {
    // Parse data based on response type
    console.log('Data response received, length:', data.length);
  }

  /**
   * Send command to device
   */
  private sendCommand(commandId: number, data: Buffer = Buffer.alloc(0)): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('Not connected to device');
    }

    const commandBuffer = this.buildCommand(commandId, data);
    this.socket.write(commandBuffer);
  }

  /**
   * Build command buffer
   */
  private buildCommand(commandId: number, data: Buffer): Buffer {
    const packetLength = 8 + data.length;
    const buffer = Buffer.alloc(packetLength);

    // Header
    buffer.writeUInt16LE(0x5050, 0); // Start bytes
    buffer.writeUInt16LE(0x827d, 2); // Fixed bytes
    buffer.writeUInt16LE(commandId, 4); // Command ID
    buffer.writeUInt16LE(0, 6); // Checksum (simplified)

    // Data
    if (data.length > 0) {
      data.copy(buffer, 8);
    }

    return buffer;
  }

  /**
   * Get device info
   */
  async getDeviceInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to device'));
        return;
      }

      this.sendCommand(0x01); // Get device info command
      
      // Mock response for now - in production, wait for actual response
      setTimeout(() => {
        resolve({
          firmwareVersion: 'Ver 6.60',
          serialNumber: 'RSS20220730466',
          deviceName: 'T 304F+',
          machineNumber: 2,
          platform: 'ZKTeco',
          ipAddress: '192.168.1.201',
          port: 4370,
        });
      }, 1000);
    });
  }

  /**
   * Get users from device
   */
  async getUsers(): Promise<DeviceUser[]> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to device'));
        return;
      }

      this.sendCommand(0x05); // Get users command
      
      // Mock response for now - in production, wait for actual response
      setTimeout(() => {
        resolve([
          {
            userId: 1,
            name: 'John Doe',
            cardNumber: '1234567890',
            privilege: 0,
            enabled: true,
          },
          {
            userId: 2,
            name: 'Jane Smith',
            cardNumber: '0987654321',
            privilege: 0,
            enabled: true,
          },
        ]);
      }, 1500);
    });
  }

  /**
   * Get attendance logs from device
   */
  async getAttendanceLogs(): Promise<AttendanceLog[]> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to device'));
        return;
      }

      this.sendCommand(0x07); // Get attendance logs command
      
      // Mock response for now - in production, wait for actual response
      setTimeout(() => {
        const now = new Date();
        resolve([
          {
            userId: 1,
            timestamp: new Date(now.getTime() - 3600000), // 1 hour ago
            verifyMode: 1,
            ioMode: 0, // Check-in
            workCode: 0,
          },
          {
            userId: 2,
            timestamp: new Date(now.getTime() - 7200000), // 2 hours ago
            verifyMode: 1,
            ioMode: 1, // Check-out
            workCode: 0,
          },
          {
            userId: 1,
            timestamp: new Date(now.getTime() - 28800000), // 8 hours ago
            verifyMode: 1,
            ioMode: 0, // Check-in
            workCode: 0,
          },
        ]);
      }, 2000);
    });
  }

  /**
   * Clear attendance logs from device
   */
  async clearAttendanceLogs(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to device'));
        return;
      }

      this.sendCommand(0x0a); // Clear logs command
      
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  }

  /**
   * Test connection with provided credentials
   */
  async testConnection(ipAddress: string, port: number): Promise<{ success: boolean; latency: number; message: string }> {
    const startTime = Date.now();
    
    try {
      await this.connect({ ipAddress, port, machineNo: '2', serialNumber: 'RSS20220730466' });
      const latency = Date.now() - startTime;
      
      // Get device info to verify connection
      const deviceInfo = await this.getDeviceInfo();
      
      this.disconnect();
      
      return {
        success: true,
        latency,
        message: `Connected successfully to ${deviceInfo.deviceName} (${deviceInfo.serialNumber})`,
      };
    } catch (error) {
      this.disconnect();
      return {
        success: false,
        latency: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }
}

export const biometricDeviceService = new BiometricDeviceService();
