# Tax Deadline Service - Integration Examples

## Example 1: Daily Insight Job Integration

This example shows how to integrate the Tax Deadline Service with a daily background job to generate proactive tax reminders.

### Daily Insight Job Processor

```typescript
// apps/api/src/modules/insights/jobs/daily-insight.processor.ts

import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { TaxDeadlineService } from '../../tax/deadlines/tax-deadline.service';
import { NotificationService } from '../../notifications/notification.service';

@Processor('daily-insights')
export class DailyInsightProcessor {
  private readonly logger = new Logger(DailyInsightProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taxDeadlineService: TaxDeadlineService,
    private readonly notificationService: NotificationService,
  ) {}

  @Process('generate-insights')
  async handleDailyInsights(job: Job) {
    this.logger.log('Generating daily insights for all organizations');

    // Get all active organizations
    const organizations = await this.prisma.organisation.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });

    let totalReminders = 0;

    for (const org of organizations) {
      try {
        // Generate tax deadline reminders
        const taxReminders = await this.taxDeadlineService.generateReminders(org.id);

        // Send reminders via notification service
        for (const reminder of taxReminders) {
          await this.notificationService.create({
            organizationId: org.id,
            type: 'TAX_REMINDER',
            priority: reminder.priority,
            title: reminder.title,
            message: reminder.description,
            actionUrl: reminder.actionUrl,
            metadata: {
              dueDate: reminder.dueDate,
              daysRemaining: reminder.daysRemaining,
              reminderType: reminder.type,
            },
          });

          totalReminders++;
        }

        if (taxReminders.length > 0) {
          this.logger.log(
            `Generated ${taxReminders.length} tax reminders for ${org.name}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to generate tax reminders for ${org.name}: ${error.message}`,
        );
      }
    }

    return {
      organizationsProcessed: organizations.length,
      totalReminders,
    };
  }
}
```

### Scheduler Service

```typescript
// apps/api/src/modules/insights/jobs/daily-insight.scheduler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class DailyInsightScheduler {
  private readonly logger = new Logger(DailyInsightScheduler.name);

  constructor(
    @InjectQueue('daily-insights')
    private readonly insightQueue: Queue,
  ) {}

  /**
   * Run daily insights at 7:00 AM every day
   */
  @Cron('0 7 * * *', {
    name: 'daily-insights',
    timeZone: 'UTC',
  })
  async scheduleDailyInsights() {
    this.logger.log('Scheduling daily insights job');

    await this.insightQueue.add('generate-insights', {}, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000,
      },
    });
  }
}
```

## Example 2: Dashboard Widget

Show upcoming tax deadlines in a dashboard widget.

```typescript
// apps/api/src/modules/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { TaxDeadlineService } from '../tax/deadlines/tax-deadline.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly taxDeadlineService: TaxDeadlineService,
  ) {}

  async getDashboardData(organizationId: string) {
    // Get tax deadline summary
    const taxSummary = await this.taxDeadlineService.getDeadlineSummary(organizationId);

    // Get active reminders
    const taxReminders = await this.taxDeadlineService.generateReminders(organizationId);

    return {
      taxDeadlines: {
        total: taxSummary.total,
        urgent: taxSummary.urgent,
        upcoming: taxSummary.upcoming,
        nextDeadline: taxSummary.nextDeadline
          ? {
              name: taxSummary.nextDeadline.name,
              dueDate: taxSummary.nextDeadline.dueDate,
              daysRemaining: taxSummary.nextDeadline.daysRemaining,
            }
          : null,
      },
      activeReminders: taxReminders.filter(r => r.priority === 'HIGH'),
    };
  }
}
```

## Example 3: Email Notification

Send email notifications for upcoming tax deadlines.

```typescript
// apps/api/src/modules/notifications/email/tax-reminder-email.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { TaxDeadlineService } from '../../tax/deadlines/tax-deadline.service';
import { EmailService } from './email.service';
import { TaxReminder } from '../../tax/deadlines/types';

@Injectable()
export class TaxReminderEmailService {
  private readonly logger = new Logger(TaxReminderEmailService.name);

  constructor(
    private readonly taxDeadlineService: TaxDeadlineService,
    private readonly emailService: EmailService,
  ) {}

  async sendTaxReminderEmail(organizationId: string, userEmail: string) {
    const reminders = await this.taxDeadlineService.generateReminders(organizationId);

    if (reminders.length === 0) {
      return;
    }

    // Group by priority
    const urgentReminders = reminders.filter(r => r.priority === 'HIGH');
    const importantReminders = reminders.filter(r => r.priority === 'MEDIUM');
    const upcomingReminders = reminders.filter(r => r.priority === 'LOW');

    // Build email content
    const emailContent = this.buildEmailContent(
      urgentReminders,
      importantReminders,
      upcomingReminders,
    );

    // Send email
    await this.emailService.send({
      to: userEmail,
      subject: this.getEmailSubject(urgentReminders.length),
      html: emailContent,
    });

    this.logger.log(
      `Sent tax reminder email to ${userEmail} with ${reminders.length} reminders`,
    );
  }

  private getEmailSubject(urgentCount: number): string {
    if (urgentCount > 0) {
      return `🔴 URGENT: ${urgentCount} Tax Deadline${urgentCount > 1 ? 's' : ''} Due Soon`;
    }
    return '📅 Upcoming Tax Deadlines';
  }

  private buildEmailContent(
    urgent: TaxReminder[],
    important: TaxReminder[],
    upcoming: TaxReminder[],
  ): string {
    let html = `
      <h2>Tax Deadline Reminders</h2>
    `;

    if (urgent.length > 0) {
      html += `
        <h3 style="color: #dc2626;">🔴 Urgent (Action Required)</h3>
        <ul>
      `;
      urgent.forEach(r => {
        html += `
          <li>
            <strong>${r.title}</strong><br>
            ${r.description}<br>
            <a href="${r.actionUrl}">Take Action →</a>
          </li>
        `;
      });
      html += `</ul>`;
    }

    if (important.length > 0) {
      html += `
        <h3 style="color: #ea580c;">🟡 Important (Action Needed Soon)</h3>
        <ul>
      `;
      important.forEach(r => {
        html += `
          <li>
            <strong>${r.title}</strong><br>
            ${r.description}<br>
            <a href="${r.actionUrl}">View Details →</a>
          </li>
        `;
      });
      html += `</ul>`;
    }

    if (upcoming.length > 0) {
      html += `
        <h3 style="color: #2563eb;">ℹ️ Upcoming</h3>
        <ul>
      `;
      upcoming.forEach(r => {
        html += `<li>${r.title}</li>`;
      });
      html += `</ul>`;
    }

    return html;
  }
}
```

## Example 4: Slack/Teams Integration

Send tax deadline notifications to Slack or Microsoft Teams.

```typescript
// apps/api/src/modules/integrations/slack/tax-reminder-slack.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { TaxDeadlineService } from '../../tax/deadlines/tax-deadline.service';
import { WebClient } from '@slack/web-api';

@Injectable()
export class TaxReminderSlackService {
  private readonly logger = new Logger(TaxReminderSlackService.name);
  private readonly slackClient: WebClient;

  constructor(
    private readonly taxDeadlineService: TaxDeadlineService,
  ) {
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  }

  async sendTaxRemindersToSlack(organizationId: string, channelId: string) {
    const reminders = await this.taxDeadlineService.generateReminders(organizationId);

    if (reminders.length === 0) {
      return;
    }

    // Build Slack message blocks
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📅 Tax Deadline Reminders',
        },
      },
    ];

    reminders.forEach(reminder => {
      const emoji = reminder.priority === 'HIGH' ? '🔴' :
                    reminder.priority === 'MEDIUM' ? '🟡' : 'ℹ️';

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${reminder.title}*\n${reminder.description}`,
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Take Action',
          },
          url: `https://operate.guru${reminder.actionUrl}`,
        },
      });
    });

    await this.slackClient.chat.postMessage({
      channel: channelId,
      blocks,
    });

    this.logger.log(`Sent ${reminders.length} tax reminders to Slack channel ${channelId}`);
  }
}
```

## Example 5: Frontend React Component

Display tax deadline warnings in a React component.

```typescript
// apps/web/src/components/TaxDeadlineWidget.tsx

import React, { useEffect, useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';

interface TaxReminder {
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  dueDate: Date;
  actionUrl: string;
  daysRemaining: number;
}

export function TaxDeadlineWidget() {
  const { organizationId } = useOrganization();
  const [reminders, setReminders] = useState<TaxReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReminders() {
      const response = await fetch(`/api/v1/tax/calendar/reminders`);
      const data = await response.json();
      setReminders(data);
      setLoading(false);
    }

    fetchReminders();
  }, [organizationId]);

  if (loading) return <div>Loading...</div>;
  if (reminders.length === 0) return null;

  const urgentReminders = reminders.filter(r => r.priority === 'HIGH');

  return (
    <div className="tax-deadline-widget">
      <h3>Tax Deadlines</h3>

      {urgentReminders.length > 0 && (
        <div className="urgent-section">
          <div className="alert alert-danger">
            <strong>⚠️ Urgent:</strong> {urgentReminders.length} deadline
            {urgentReminders.length > 1 ? 's' : ''} due soon!
          </div>
        </div>
      )}

      <ul className="reminder-list">
        {reminders.map((reminder, idx) => (
          <li
            key={idx}
            className={`reminder-item priority-${reminder.priority.toLowerCase()}`}
          >
            <div className="reminder-title">{reminder.title}</div>
            <div className="reminder-description">{reminder.description}</div>
            <a href={reminder.actionUrl} className="btn btn-sm btn-primary">
              Take Action →
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Testing the Integration

```typescript
// Test the daily job manually
import { TaxDeadlineService } from './modules/tax/deadlines/tax-deadline.service';
import { PrismaService } from './modules/database/prisma.service';

async function testTaxReminders() {
  const prisma = new PrismaService();
  const service = new TaxDeadlineService(prisma);

  // Test for a specific organization
  const orgId = 'your-org-id';

  console.log('Fetching upcoming deadlines...');
  const upcoming = await service.getUpcomingDeadlines(orgId, 30);
  console.log(`Found ${upcoming.length} upcoming deadlines:`, upcoming);

  console.log('\nGenerating reminders...');
  const reminders = await service.generateReminders(orgId);
  console.log(`Generated ${reminders.length} reminders:`, reminders);

  console.log('\nGetting summary...');
  const summary = await service.getDeadlineSummary(orgId);
  console.log('Summary:', summary);
}
```
