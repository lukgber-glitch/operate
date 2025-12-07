import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

/**
 * Email notification channel
 * Handles sending notifications via email using SendGrid
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private enabled: boolean;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly maxRetries = 3;

  constructor(private configService: ConfigService) {
    // Check if email notifications are enabled
    this.enabled = this.configService.get('notifications.email.enabled', false);

    // Get SendGrid configuration
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL', 'noreply@operate.guru');
    this.fromName = this.configService.get<string>('SENDGRID_FROM_NAME', 'Operate');

    // Initialize SendGrid if API key is provided
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.enabled = true;
      this.logger.log('Email notification channel initialized with SendGrid');
    } else if (this.enabled) {
      this.logger.warn('Email notifications enabled but SENDGRID_API_KEY not configured');
      this.enabled = false;
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

    if (!this.isValidEmail(to)) {
      this.logger.error(`Invalid email address: ${to}`);
      return false;
    }

    // Try sending with retry logic
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.log(
          `Sending email to ${to} (attempt ${attempt}/${this.maxRetries})`,
        );

        const msg = {
          to,
          from: {
            email: this.fromEmail,
            name: this.fromName,
          },
          subject,
          html: body,
          text: this.stripHtml(body), // Plain text fallback
          trackingSettings: {
            clickTracking: {
              enable: true,
              enableText: false,
            },
            openTracking: {
              enable: true,
            },
          },
          customArgs: metadata || {},
        };

        const response = await sgMail.send(msg);

        this.logger.log(
          `Email sent successfully to ${to}, Message ID: ${response[0].headers['x-message-id']}`,
        );

        return true;
      } catch (error) {
        this.logger.error(
          `Attempt ${attempt}/${this.maxRetries} failed to send email to ${to}: ${error.message}`,
        );

        // Log SendGrid specific error details
        if (error.response) {
          this.logger.error(
            `SendGrid error: ${JSON.stringify(error.response.body)}`,
          );
        }

        // If this was the last attempt, return false
        if (attempt === this.maxRetries) {
          this.logger.error(
            `All ${this.maxRetries} attempts failed for email to ${to}`,
            error.stack,
          );
          return false;
        }

        // Wait before retrying (exponential backoff)
        const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        this.logger.log(`Retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
      }
    }

    return false;
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
   * Strip HTML tags from content for plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
