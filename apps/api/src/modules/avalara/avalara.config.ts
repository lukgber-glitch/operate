import { registerAs } from '@nestjs/config';

export interface AvalaraConfig {
  accountId: string;
  licenseKey: string;
  environment: 'sandbox' | 'production';
  companyCode: string;
  appName: string;
  appVersion: string;
  machineName: string;
  timeout: number;
}

export default registerAs('avalara', (): AvalaraConfig => {
  const environment = process.env.AVALARA_ENVIRONMENT || 'sandbox';
  
  if (environment !== 'sandbox' && environment !== 'production') {
    throw new Error('AVALARA_ENVIRONMENT must be either "sandbox" or "production"');
  }

  return {
    accountId: process.env.AVALARA_ACCOUNT_ID || '',
    licenseKey: process.env.AVALARA_LICENSE_KEY || '',
    environment,
    companyCode: process.env.AVALARA_COMPANY_CODE || 'DEFAULT',
    appName: 'Operate/CoachOS',
    appVersion: '1.0.0',
    machineName: process.env.HOSTNAME || 'operate-api',
    timeout: 30000, // 30 seconds
  };
});
