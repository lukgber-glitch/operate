# Phase 5: Notification System Specification

## Overview

Build a comprehensive notification system supporting in-app, email, and push notifications with configurable preferences per user.

---

## Database Schema

```prisma
// packages/database/prisma/schema.prisma

model Notification {
  id              String              @id @default(cuid())
  organisationId  String
  organisation    Organisation        @relation(fields: [organisationId], references: [id])

  userId          String?             // Null = org-wide notification
  user            User?               @relation(fields: [userId], references: [id])

  // Content
  type            NotificationType
  category        NotificationCategory
  priority        Int                 @default(5)  // 1-10
  title           String
  body            String              @db.Text
  actionUrl       String?
  actionLabel     String?

  // Related entity
  relatedType     String?
  relatedId       String?

  // Delivery status
  channels        NotificationChannel[]
  deliveredVia    NotificationChannel[] @default([])

  // Status
  readAt          DateTime?
  dismissedAt     DateTime?
  archivedAt      DateTime?

  // Scheduling
  scheduledFor    DateTime?
  expiresAt       DateTime?

  createdAt       DateTime            @default(now())

  @@index([organisationId])
  @@index([userId])
  @@index([type])
  @@index([readAt])
  @@index([createdAt])
}

model NotificationPreference {
  id              String              @id @default(cuid())
  userId          String
  user            User                @relation(fields: [userId], references: [id])

  category        NotificationCategory
  channels        NotificationChannel[] @default([IN_APP])
  enabled         Boolean             @default(true)

  // Quiet hours
  quietStart      String?             // "22:00"
  quietEnd        String?             // "08:00"

  @@unique([userId, category])
  @@index([userId])
}

model PushSubscription {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])

  // FCM token
  token           String    @unique
  platform        Platform
  deviceName      String?

  // Status
  isActive        Boolean   @default(true)
  lastUsedAt      DateTime  @default(now())

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
}

model EmailTemplate {
  id              String    @id @default(cuid())
  name            String    @unique
  subject         String
  htmlBody        String    @db.Text
  textBody        String?   @db.Text

  // Variables
  variables       String[]  @default([])

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model ScheduledNotification {
  id              String              @id @default(cuid())
  organisationId  String
  organisation    Organisation        @relation(fields: [organisationId], references: [id])

  // Schedule
  type            ScheduleType
  cronExpression  String?             // For recurring
  nextRunAt       DateTime
  lastRunAt       DateTime?

  // Template
  templateType    NotificationType
  templateData    Json

  // Status
  isActive        Boolean             @default(true)

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@index([organisationId])
  @@index([nextRunAt])
}

enum NotificationType {
  // Deadlines
  TAX_DEADLINE
  INVOICE_DUE
  CONTRACT_EXPIRY

  // Finance
  INVOICE_CREATED
  INVOICE_SENT
  INVOICE_PAID
  INVOICE_OVERDUE
  PAYMENT_RECEIVED
  EXPENSE_APPROVED
  EXPENSE_REJECTED

  // Banking
  LARGE_TRANSACTION
  LOW_BALANCE
  SYNC_ERROR

  // AI
  AI_INSIGHT
  ANOMALY_DETECTED
  SUGGESTION

  // System
  CONNECTION_EXPIRED
  SYNC_COMPLETED
  EXPORT_READY

  // HR
  LEAVE_REQUEST
  LEAVE_APPROVED
  LEAVE_REJECTED
}

enum NotificationCategory {
  DEADLINES
  INVOICES
  EXPENSES
  BANKING
  AI_INSIGHTS
  SYSTEM
  HR
}

enum NotificationChannel {
  IN_APP
  EMAIL
  PUSH
  SMS
}

enum Platform {
  WEB
  IOS
  ANDROID
}

enum ScheduleType {
  ONE_TIME
  DAILY
  WEEKLY
  MONTHLY
  CUSTOM
}
```

---

## API Endpoints

### Notifications Controller

```typescript
// apps/api/src/notifications/notifications.controller.ts

@Controller('notifications')
export class NotificationsController {

  // List notifications
  @Get()
  async listNotifications(
    @CurrentUser() userId: string,
    @CurrentOrg() orgId: string,
    @Query() query: NotificationQuery
  ): Promise<PaginatedResponse<Notification>>

  // Get unread count
  @Get('unread-count')
  async getUnreadCount(
    @CurrentUser() userId: string,
    @CurrentOrg() orgId: string
  ): Promise<{ count: number; urgent: number }>

  // Get single notification
  @Get(':id')
  async getNotification(
    @Param('id') notificationId: string
  ): Promise<Notification>

  // Mark as read
  @Post(':id/read')
  async markAsRead(
    @Param('id') notificationId: string
  ): Promise<void>

  // Mark as unread
  @Post(':id/unread')
  async markAsUnread(
    @Param('id') notificationId: string
  ): Promise<void>

  // Mark all as read
  @Post('read-all')
  async markAllAsRead(
    @CurrentUser() userId: string,
    @CurrentOrg() orgId: string
  ): Promise<void>

  // Dismiss notification
  @Post(':id/dismiss')
  async dismiss(
    @Param('id') notificationId: string
  ): Promise<void>

  // Archive notification
  @Post(':id/archive')
  async archive(
    @Param('id') notificationId: string
  ): Promise<void>
}
```

### Preferences Controller

```typescript
// apps/api/src/notifications/preferences.controller.ts

@Controller('notifications/preferences')
export class NotificationPreferencesController {

  // Get all preferences
  @Get()
  async getPreferences(
    @CurrentUser() userId: string
  ): Promise<NotificationPreference[]>

  // Update preference
  @Patch(':category')
  async updatePreference(
    @CurrentUser() userId: string,
    @Param('category') category: NotificationCategory,
    @Body() dto: UpdatePreferenceDto
  ): Promise<NotificationPreference>

  // Reset to defaults
  @Post('reset')
  async resetPreferences(
    @CurrentUser() userId: string
  ): Promise<NotificationPreference[]>
}
```

### Push Subscriptions Controller

```typescript
// apps/api/src/notifications/push.controller.ts

@Controller('notifications/push')
export class PushController {

  // Register device
  @Post('subscribe')
  async subscribe(
    @CurrentUser() userId: string,
    @Body() dto: SubscribeDto
  ): Promise<PushSubscription>

  // Unregister device
  @Delete('unsubscribe')
  async unsubscribe(
    @CurrentUser() userId: string,
    @Body() dto: UnsubscribeDto
  ): Promise<void>

  // List devices
  @Get('devices')
  async listDevices(
    @CurrentUser() userId: string
  ): Promise<PushSubscription[]>
}
```

---

## Services

### Notification Service

```typescript
// apps/api/src/notifications/notification.service.ts

@Injectable()
export class NotificationService {

  async send(
    notification: CreateNotificationDto
  ): Promise<Notification> {
    // 1. Create notification record
    const created = await this.prisma.notification.create({
      data: notification,
    });

    // 2. Get user preferences
    const preferences = await this.getPreferences(
      notification.userId,
      notification.category
    );

    // 3. Deliver via enabled channels
    const deliveredVia: NotificationChannel[] = [];

    if (preferences.channels.includes('IN_APP')) {
      await this.deliverInApp(created);
      deliveredVia.push('IN_APP');
    }

    if (preferences.channels.includes('EMAIL')) {
      await this.deliverEmail(created);
      deliveredVia.push('EMAIL');
    }

    if (preferences.channels.includes('PUSH')) {
      await this.deliverPush(created);
      deliveredVia.push('PUSH');
    }

    // 4. Update delivery status
    return this.prisma.notification.update({
      where: { id: created.id },
      data: { deliveredVia },
    });
  }

  private async deliverInApp(notification: Notification): Promise<void> {
    // Emit via WebSocket
    this.eventEmitter.emit('notification.new', {
      userId: notification.userId,
      notification,
    });
  }

  private async deliverEmail(notification: Notification): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: notification.userId },
    });

    const template = this.getEmailTemplate(notification.type);

    await this.emailService.send({
      to: user.email,
      subject: template.subject,
      html: this.renderTemplate(template.htmlBody, notification),
    });
  }

  private async deliverPush(notification: Notification): Promise<void> {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId: notification.userId, isActive: true },
    });

    for (const sub of subscriptions) {
      await this.firebaseService.sendToDevice(sub.token, {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          type: notification.type,
          actionUrl: notification.actionUrl,
          notificationId: notification.id,
        },
      });
    }
  }
}
```

### Deadline Reminder Service

```typescript
// apps/api/src/notifications/deadline-reminder.service.ts

@Injectable()
export class DeadlineReminderService {

  // Run hourly
  @Cron('0 * * * *')
  async checkDeadlines(): Promise<void> {
    const organisations = await this.getActiveOrganisations();

    for (const org of organisations) {
      await this.checkVatDeadlines(org);
      await this.checkInvoiceDeadlines(org);
      await this.checkContractExpirations(org);
    }
  }

  private async checkVatDeadlines(org: Organisation): Promise<void> {
    const country = await this.getOrgCountry(org.id);
    const vatDeadline = this.getNextVatDeadline(country);

    const daysUntil = differenceInDays(vatDeadline, new Date());

    // Reminder schedule: 30, 14, 7, 3, 1 days before
    const reminderDays = [30, 14, 7, 3, 1];

    if (reminderDays.includes(daysUntil)) {
      // Check if already sent
      const existing = await this.prisma.notification.findFirst({
        where: {
          organisationId: org.id,
          type: 'TAX_DEADLINE',
          relatedId: `vat-${format(vatDeadline, 'yyyy-MM')}`,
          createdAt: {
            gte: subDays(new Date(), 1),
          },
        },
      });

      if (!existing) {
        // Get all admins/owners
        const recipients = await this.getAdminUsers(org.id);

        for (const user of recipients) {
          await this.notificationService.send({
            organisationId: org.id,
            userId: user.id,
            type: 'TAX_DEADLINE',
            category: 'DEADLINES',
            priority: daysUntil <= 3 ? 9 : 7,
            title: `VAT Return due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
            body: `Your ${format(vatDeadline, 'MMMM yyyy')} VAT return is due on ${format(vatDeadline, 'MMMM d')}. Review and submit before the deadline.`,
            actionUrl: '/tax/vat-return',
            actionLabel: 'Prepare VAT Return',
            relatedType: 'vat_deadline',
            relatedId: `vat-${format(vatDeadline, 'yyyy-MM')}`,
            channels: ['IN_APP', 'EMAIL'],
          });
        }
      }
    }
  }

  private async checkInvoiceDeadlines(org: Organisation): Promise<void> {
    // Find invoices due in 3 days
    const dueSoon = await this.prisma.invoice.findMany({
      where: {
        organisationId: org.id,
        status: 'SENT',
        dueDate: {
          gte: new Date(),
          lte: addDays(new Date(), 3),
        },
      },
    });

    for (const invoice of dueSoon) {
      const daysUntil = differenceInDays(invoice.dueDate, new Date());

      await this.notificationService.send({
        organisationId: org.id,
        type: 'INVOICE_DUE',
        category: 'INVOICES',
        priority: daysUntil <= 1 ? 8 : 6,
        title: `Invoice ${invoice.number} due ${daysUntil === 0 ? 'today' : `in ${daysUntil} days`}`,
        body: `€${invoice.total} from ${invoice.customerName}`,
        actionUrl: `/finance/invoices/${invoice.id}`,
        actionLabel: 'View Invoice',
        relatedType: 'invoice',
        relatedId: invoice.id,
        channels: ['IN_APP'],
      });
    }

    // Find overdue invoices (not yet notified today)
    const overdue = await this.prisma.invoice.findMany({
      where: {
        organisationId: org.id,
        status: { in: ['SENT', 'OVERDUE'] },
        dueDate: { lt: new Date() },
      },
    });

    for (const invoice of overdue) {
      const daysOverdue = differenceInDays(new Date(), invoice.dueDate);

      // Only notify at 1, 7, 14, 30, 60 days overdue
      if ([1, 7, 14, 30, 60].includes(daysOverdue)) {
        await this.notificationService.send({
          organisationId: org.id,
          type: 'INVOICE_OVERDUE',
          category: 'INVOICES',
          priority: daysOverdue >= 30 ? 9 : 7,
          title: `Invoice ${invoice.number} is ${daysOverdue} days overdue`,
          body: `€${invoice.total} from ${invoice.customerName}. Consider sending a reminder.`,
          actionUrl: `/finance/invoices/${invoice.id}`,
          actionLabel: 'Send Reminder',
          relatedType: 'invoice',
          relatedId: invoice.id,
          channels: ['IN_APP', 'EMAIL'],
        });
      }
    }
  }
}
```

---

## WebSocket Real-Time Updates

```typescript
// apps/api/src/notifications/notification.gateway.ts

@WebSocketGateway({ namespace: '/notifications' })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    const userId = this.extractUserId(client);
    if (!userId) {
      client.disconnect();
      return;
    }

    // Track user's sockets
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(client.id);

    client.join(`user:${userId}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.extractUserId(client);
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  @OnEvent('notification.new')
  handleNewNotification(payload: { userId: string; notification: Notification }) {
    this.server
      .to(`user:${payload.userId}`)
      .emit('notification', payload.notification);
  }

  @OnEvent('notification.read')
  handleNotificationRead(payload: { userId: string; notificationId: string }) {
    this.server
      .to(`user:${payload.userId}`)
      .emit('notification:read', { id: payload.notificationId });
  }
}
```

---

## Frontend Components

### WebSocket Hook

```typescript
// apps/web/src/hooks/use-notifications.ts

export function useNotifications() {
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    const sock = io('/notifications', {
      auth: { token: getAccessToken() },
    });

    sock.on('notification', (notification: Notification) => {
      // Update cache
      queryClient.setQueryData(['notifications'], (old: Notification[]) => {
        return [notification, ...old];
      });

      // Update unread count
      queryClient.invalidateQueries(['notifications', 'unread-count']);

      // Show toast
      toast({
        title: notification.title,
        description: notification.body,
        action: notification.actionUrl && (
          <ToastAction altText="View" onClick={() => router.push(notification.actionUrl)}>
            {notification.actionLabel || 'View'}
          </ToastAction>
        ),
      });
    });

    sock.on('notification:read', ({ id }) => {
      queryClient.setQueryData(['notifications'], (old: Notification[]) => {
        return old.map(n => n.id === id ? { ...n, readAt: new Date() } : n);
      });
      queryClient.invalidateQueries(['notifications', 'unread-count']);
    });

    setSocket(sock);

    return () => {
      sock.disconnect();
    };
  }, []);

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
  });

  // Fetch unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data),
    refetchInterval: 60000, // Refresh every minute
  });

  // Mutations
  const markAsRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  return {
    notifications,
    unreadCount: unreadCount?.count ?? 0,
    urgentCount: unreadCount?.urgent ?? 0,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
  };
}
```

### Notification Preferences Page

```typescript
// apps/web/src/app/(dashboard)/settings/notifications/page.tsx

export default function NotificationPreferencesPage() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreference = useUpdatePreference();

  const categories = [
    { key: 'DEADLINES', label: 'Tax & Deadlines', description: 'VAT returns, filing dates, contract expirations' },
    { key: 'INVOICES', label: 'Invoices', description: 'Invoice creation, payments, overdue notices' },
    { key: 'EXPENSES', label: 'Expenses', description: 'Expense approvals and rejections' },
    { key: 'BANKING', label: 'Banking', description: 'Large transactions, low balance, sync errors' },
    { key: 'AI_INSIGHTS', label: 'AI Insights', description: 'Suggestions, anomalies, opportunities' },
    { key: 'SYSTEM', label: 'System', description: 'Connection status, exports, updates' },
    { key: 'HR', label: 'HR', description: 'Leave requests and approvals' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground">
          Choose how and when you want to receive notifications
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Category</TableHead>
                <TableHead className="text-center">In-App</TableHead>
                <TableHead className="text-center">Email</TableHead>
                <TableHead className="text-center">Push</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(category => {
                const pref = preferences?.find(p => p.category === category.key);

                return (
                  <TableRow key={category.key}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{category.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={pref?.channels.includes('IN_APP') ?? true}
                        disabled // In-app always enabled
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={pref?.channels.includes('EMAIL') ?? false}
                        onCheckedChange={(checked) => {
                          updatePreference.mutate({
                            category: category.key,
                            channels: toggleChannel(pref?.channels || ['IN_APP'], 'EMAIL', checked),
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={pref?.channels.includes('PUSH') ?? false}
                        onCheckedChange={(checked) => {
                          updatePreference.mutate({
                            category: category.key,
                            channels: toggleChannel(pref?.channels || ['IN_APP'], 'PUSH', checked),
                          });
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Pause non-urgent notifications during these hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>From</Label>
              <Select defaultValue="22:00">
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>To</Label>
              <Select defaultValue="08:00">
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Email Templates

### Tax Deadline Reminder

```html
<!-- templates/tax-deadline.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Email-safe styles */
  </style>
</head>
<body>
  <div class="container">
    <h1>Tax Deadline Reminder</h1>

    <p>Hi {{userName}},</p>

    <p>Your <strong>{{deadlineType}}</strong> is due on <strong>{{deadlineDate}}</strong>
       ({{daysUntil}} days from now).</p>

    <div class="card">
      <h3>What you need to do:</h3>
      <ol>
        <li>Review your transactions for the period</li>
        <li>Verify deductions are properly categorized</li>
        <li>Submit via ELSTER before the deadline</li>
      </ol>
    </div>

    <a href="{{actionUrl}}" class="button">Prepare {{deadlineType}}</a>

    <p class="footer">
      This is an automated reminder from Operate.
      <a href="{{unsubscribeUrl}}">Manage notification preferences</a>
    </p>
  </div>
</body>
</html>
```

---

## Success Criteria

- [ ] Real-time notifications via WebSocket
- [ ] Email delivery within 30 seconds
- [ ] Push notifications work on web & mobile
- [ ] Preferences respected per category
- [ ] Quiet hours prevent notifications during set times
- [ ] Tax deadlines sent at correct intervals (30, 14, 7, 3, 1 days)
- [ ] No duplicate notifications
- [ ] Unsubscribe link in all emails
- [ ] GDPR compliant (can opt out)
