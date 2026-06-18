declare module 'zklib-js' {
  class ZKLib {
    constructor(ip: string, port: number, timeout?: number, inport?: number);
    createSocket(): Promise<void>;
    disconnect(): Promise<void>;
    getInfo(): Promise<any>;
    getAttendances(): Promise<any[]>;
    getUsers(): Promise<any[]>;
    getUser(userId: number): Promise<any>;
    setUser(user: any): Promise<any>;
    deleteUser(userId: number): Promise<any>;
    clearAttendance(): Promise<any>;
    getFace(): Promise<any>;
    getFingerprint(userId: number): Promise<any>;
    getSerialNumber(): Promise<string>;
    getVendor(): Promise<string>;
    getDeviceName(): Promise<string>;
    getPlatform(): Promise<string>;
    getFirmwareVersion(): Promise<string>;
    getOSVersion(): Promise<string>;
    getWorkCode(): Promise<any>;
    getSSR(): Promise<any>;
    setSocket(socket: any): void;
    getSocket(): any;
    executeCmd(command: number, data: any): Promise<any>;
    startRealtime(callback: any): void;
    stopRealtime(): void;
  }

  export default ZKLib;
}
