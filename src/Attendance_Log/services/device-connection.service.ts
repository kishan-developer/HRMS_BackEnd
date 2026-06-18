import ZKLib from "zklib-js";

export interface DeviceConfig {
  ipAddress: string;
  port: number;
  timeout?: number;
  inport?: number;
}

export class DeviceConnectionService {
  private zk: any;

  constructor(private config: DeviceConfig) {}

  async connect(): Promise<void> {
    try {
      this.zk = new ZKLib(
        this.config.ipAddress,
        this.config.port,
        this.config.timeout || 10000,
        this.config.inport || 4000
      );

      await this.zk.createSocket();
      console.log(`Connected to device at ${this.config.ipAddress}:${this.config.port}`);
    } catch (error) {
      console.error(`Failed to connect to device:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.zk) {
        await this.zk.disconnect();
        console.log(`Disconnected from device at ${this.config.ipAddress}`);
      }
    } catch (error) {
      console.error(`Error disconnecting from device:`, error);
    }
  }

  getZKInstance(): any {
    return this.zk;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      const info = await this.zk.getDeviceInfo();
      await this.disconnect();
      return !!info;
    } catch (error) {
      console.error(`Connection test failed:`, error);
      return false;
    }
  }
}
