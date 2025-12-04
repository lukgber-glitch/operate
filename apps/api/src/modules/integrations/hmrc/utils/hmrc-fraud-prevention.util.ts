import * as os from 'os';
import { HmrcFraudPreventionHeaders } from '../interfaces/hmrc.interface';

/**
 * HMRC Fraud Prevention Headers Utility
 *
 * Implements fraud prevention headers required by HMRC for all API calls.
 * These headers help HMRC detect and prevent fraudulent activity.
 *
 * @see https://developer.service.hmrc.gov.uk/guides/fraud-prevention/
 *
 * CRITICAL: All MTD API calls MUST include these headers or they will be rejected.
 *
 * Required Headers:
 * - Gov-Client-Connection-Method: How the client is connecting
 * - Gov-Client-Device-ID: Unique device identifier
 * - Gov-Client-User-IDs: User identifiers
 * - Gov-Client-Timezone: Client timezone
 * - Gov-Client-Local-IPs: Local IP addresses
 * - Gov-Client-Screens: Screen information
 * - Gov-Client-Window-Size: Window dimensions
 * - Gov-Client-Browser-Plugins: Browser plugins
 * - Gov-Client-Browser-JS-User-Agent: JavaScript user agent
 * - Gov-Client-Browser-Do-Not-Track: Do Not Track setting
 *
 * Optional but Recommended:
 * - Gov-Client-Multi-Factor: Multi-factor authentication info
 * - Gov-Client-Public-IP: Public IP address
 * - Gov-Client-Public-Port: Public port
 * - Gov-Vendor-Version: Software version
 * - Gov-Vendor-Product-Name: Product name
 */
export class HmrcFraudPreventionUtil {
  private static readonly VENDOR_PRODUCT_NAME = 'Operate-CoachOS';
  private static readonly VENDOR_VERSION = '1.0.0';

  /**
   * Generate fraud prevention headers for server-to-server connections
   * Use this for OAuth token exchange and API calls from the backend
   */
  static generateServerHeaders(
    deviceId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): HmrcFraudPreventionHeaders {
    const timezone = this.getTimezone();
    const localIps = this.getLocalIPs();

    const headers: HmrcFraudPreventionHeaders = {
      'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
      'Gov-Client-Device-ID': deviceId,
      'Gov-Client-User-IDs': `os=${userId}`,
      'Gov-Client-Timezone': timezone,
      'Gov-Client-Local-IPs': localIps,
      'Gov-Client-Screens': 'width=1920&height=1080&scaling-factor=1&colour-depth=24',
      'Gov-Client-Window-Size': 'width=1920&height=1080',
      'Gov-Client-Browser-Plugins': 'PDF,Flash',
      'Gov-Client-Browser-JS-User-Agent': userAgent || this.getDefaultUserAgent(),
      'Gov-Client-Browser-Do-Not-Track': 'false',
      'Gov-Vendor-Version': `${this.VENDOR_PRODUCT_NAME}=${this.VENDOR_VERSION}`,
      'Gov-Vendor-Product-Name': this.VENDOR_PRODUCT_NAME,
    };

    // Add optional public IP if available
    if (ipAddress) {
      headers['Gov-Client-Public-IP'] = ipAddress;
    }

    return headers;
  }

  /**
   * Generate fraud prevention headers for browser-based connections
   * Use this when user is directly interacting via web browser
   */
  static generateBrowserHeaders(
    deviceId: string,
    userId: string,
    clientData: {
      timezone?: string;
      screenWidth?: number;
      screenHeight?: number;
      colorDepth?: number;
      windowWidth?: number;
      windowHeight?: number;
      plugins?: string[];
      userAgent?: string;
      doNotTrack?: boolean;
      publicIp?: string;
      publicPort?: string;
    },
  ): HmrcFraudPreventionHeaders {
    const timezone = clientData.timezone || this.getTimezone();
    const localIps = this.getLocalIPs();

    const screenInfo = this.formatScreenInfo(
      clientData.screenWidth || 1920,
      clientData.screenHeight || 1080,
      clientData.colorDepth || 24,
    );

    const windowInfo = this.formatWindowInfo(
      clientData.windowWidth || 1920,
      clientData.windowHeight || 1080,
    );

    const plugins = this.formatPlugins(clientData.plugins || ['PDF']);

    const headers: HmrcFraudPreventionHeaders = {
      'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
      'Gov-Client-Device-ID': deviceId,
      'Gov-Client-User-IDs': `os=${userId}`,
      'Gov-Client-Timezone': timezone,
      'Gov-Client-Local-IPs': localIps,
      'Gov-Client-Screens': screenInfo,
      'Gov-Client-Window-Size': windowInfo,
      'Gov-Client-Browser-Plugins': plugins,
      'Gov-Client-Browser-JS-User-Agent': clientData.userAgent || this.getDefaultUserAgent(),
      'Gov-Client-Browser-Do-Not-Track': String(clientData.doNotTrack || false),
      'Gov-Vendor-Version': `${this.VENDOR_PRODUCT_NAME}=${this.VENDOR_VERSION}`,
      'Gov-Vendor-Product-Name': this.VENDOR_PRODUCT_NAME,
    };

    // Add optional fields
    if (clientData.publicIp) {
      headers['Gov-Client-Public-IP'] = clientData.publicIp;
    }

    if (clientData.publicPort) {
      headers['Gov-Client-Public-Port'] = clientData.publicPort;
    }

    return headers;
  }

  /**
   * Generate fraud prevention headers for batch/background processing
   */
  static generateBatchHeaders(
    deviceId: string,
    userId: string,
  ): HmrcFraudPreventionHeaders {
    return {
      'Gov-Client-Connection-Method': 'BATCH_PROCESS_DIRECT',
      'Gov-Client-Device-ID': deviceId,
      'Gov-Client-User-IDs': `os=${userId}`,
      'Gov-Client-Timezone': this.getTimezone(),
      'Gov-Client-Local-IPs': this.getLocalIPs(),
      'Gov-Client-Screens': 'width=1920&height=1080&scaling-factor=1&colour-depth=24',
      'Gov-Client-Window-Size': 'width=1920&height=1080',
      'Gov-Client-Browser-Plugins': '',
      'Gov-Client-Browser-JS-User-Agent': this.getDefaultUserAgent(),
      'Gov-Client-Browser-Do-Not-Track': 'false',
      'Gov-Vendor-Version': `${this.VENDOR_PRODUCT_NAME}=${this.VENDOR_VERSION}`,
      'Gov-Vendor-Product-Name': this.VENDOR_PRODUCT_NAME,
    };
  }

  /**
   * Get system timezone in UTC offset format
   */
  private static getTimezone(): string {
    const offset = -new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';
    return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  /**
   * Get local IP addresses
   */
  private static getLocalIPs(): string {
    const interfaces = os.networkInterfaces();
    const ips: string[] = [];

    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;

      for (const alias of iface) {
        // Skip internal and non-IPv4 addresses
        if (alias.family === 'IPv4' && !alias.internal) {
          ips.push(alias.address);
        }
      }
    }

    // If no IPs found, use localhost
    if (ips.length === 0) {
      ips.push('127.0.0.1');
    }

    return ips.join(',');
  }

  /**
   * Format screen information
   */
  private static formatScreenInfo(
    width: number,
    height: number,
    colorDepth: number,
  ): string {
    return `width=${width}&height=${height}&scaling-factor=1&colour-depth=${colorDepth}`;
  }

  /**
   * Format window size information
   */
  private static formatWindowInfo(width: number, height: number): string {
    return `width=${width}&height=${height}`;
  }

  /**
   * Format browser plugins
   */
  private static formatPlugins(plugins: string[]): string {
    return plugins.length > 0 ? plugins.join(',') : 'none';
  }

  /**
   * Get default user agent string
   */
  private static getDefaultUserAgent(): string {
    const nodeVersion = process.version;
    const platform = os.platform();
    return `Operate-CoachOS/1.0.0 (${platform}; Node.js ${nodeVersion})`;
  }

  /**
   * Validate fraud prevention headers
   */
  static validateHeaders(headers: Partial<HmrcFraudPreventionHeaders>): boolean {
    const requiredFields: (keyof HmrcFraudPreventionHeaders)[] = [
      'Gov-Client-Connection-Method',
      'Gov-Client-Device-ID',
      'Gov-Client-User-IDs',
      'Gov-Client-Timezone',
      'Gov-Client-Local-IPs',
      'Gov-Client-Screens',
      'Gov-Client-Window-Size',
      'Gov-Client-Browser-Plugins',
      'Gov-Client-Browser-JS-User-Agent',
      'Gov-Client-Browser-Do-Not-Track',
    ];

    for (const field of requiredFields) {
      if (!headers[field]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get connection method based on context
   */
  static getConnectionMethod(context: 'server' | 'browser' | 'batch'): string {
    switch (context) {
      case 'server':
        return 'WEB_APP_VIA_SERVER';
      case 'browser':
        return 'WEB_APP_VIA_SERVER';
      case 'batch':
        return 'BATCH_PROCESS_DIRECT';
      default:
        return 'WEB_APP_VIA_SERVER';
    }
  }
}
