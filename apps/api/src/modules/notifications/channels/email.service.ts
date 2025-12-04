import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Email notification channel
 * Handles sending notifications via email
 *
 * Note: This is a basic implementation. In production, you would use
 * services like SendGrid, AWS SES, or Resend for better deliverability.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private enabled: boolean;

  constructor(private configService: ConfigService) {
    // Check if email notifications are enabled
    this.enabled = this.configService.get('notifications.email.enabled', false);

    if (this.enabled) {
      this.logger.log('Email notification channel initialized');
    } else {
      this.logger.warn('Email notification channel is disabled');
    }
  }

  /**
   * Send an email notification
   */
  async sendNotification(
    to: string,
    subject: string,
    body: string,
    metadata?: Record<string, any>,
  ): Promise<boolean> {
    if (!this.enabled) {
      this.logger.warn('Email notifications are disabled. Skipping email send.');
      return false;
    }

    try {
      // TODO: Implement actual email sending using nodemailer, resend, or similar
      // For now, we'll just log the notification
      this.logger.log(
        `[EMAIL] To: ${to}, Subject: ${subject}, Body: ${body.substring(0, 100)}...`,
      );

      // Simulate async email sending
      await this.simulateEmailSend(to, subject, body, metadata);

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Send a notification email (simplified interface)
   */
  async send(params: {
    to: string;
    subject: string;
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    priority?: number;
  }): Promise<boolean> {
    const { to, subject, title, message, actionUrl, actionText, priority } = params;

    // Generate email HTML body
    const htmlBody = this.generateEmailTemplate({
      title,
      message,
      actionUrl,
      actionText,
      priority,
    });

    return this.sendNotification(to, subject, htmlBody, {
      priority,
    });
  }

  /**
   * Generate email HTML template
   */
  private generateEmailTemplate(params: {
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    priority?: number;
  }): string {
    const { title, message, actionUrl, actionText, priority = 3 } = params;

    const priorityColors: Record<number, string> = {
      1: '#6B7280', // Low - Gray
      2: '#3B82F6', // Normal - Blue
      3: '#10B981', // Medium - Green
      4: '#F59E0B', // High - Orange
      5: '#EF4444', // Critical - Red
    };

    const priorityColor = priorityColors[priority] || priorityColors[3];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <div style="border-left: 4px solid ${priorityColor}; padding-left: 16px; margin-bottom: 20px;">
              <h1 style="margin: 0; color: ${priorityColor}; font-size: 24px;">${title}</h1>
            </div>

            <div style="background-color: white; border-radius: 4px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 16px; color: #4B5563;">${message}</p>
            </div>

            ${actionUrl && actionText ? `
              <div style="text-align: center; margin-top: 30px;">
                <a href="${actionUrl}" style="display: inline-block; background-color: ${priorityColor}; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  ${actionText}
                </a>
              </div>
            ` : ''}
          </div>

          <div style="text-align: center; color: #6B7280; font-size: 12px; margin-top: 30px;">
            <p>This is an automated notification from Operate/CoachOS</p>
            <p>If you have questions, please contact your system administrator</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Simulate email sending (placeholder for actual implementation)
   */
  private async simulateEmailSend(
    to: string,
    subject: string,
    body: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // In production, replace this with:
    // - Nodemailer: for SMTP-based sending
    // - Resend: for modern email API
    // - AWS SES: for AWS infrastructure
    // - SendGrid: for enterprise email delivery

    this.logger.debug(`Email queued for delivery to ${to}`);
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
