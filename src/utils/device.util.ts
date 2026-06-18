import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  userAgent: string;
  browser: string;
  os: string;
  device: string;
}

export const parseDeviceInfo = (userAgent: string): DeviceInfo => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    userAgent,
    browser: result.browser.name || 'Unknown',
    os: result.os.name || 'Unknown',
    device: result.device.type || 'desktop',
  };
};

export const getDeviceName = (deviceInfo: DeviceInfo): string => {
  const { browser, os, device } = deviceInfo;
  const deviceType = device === 'mobile' ? 'Mobile' : device === 'tablet' ? 'Tablet' : 'Desktop';
  return `${deviceType} - ${browser} on ${os}`;
};
