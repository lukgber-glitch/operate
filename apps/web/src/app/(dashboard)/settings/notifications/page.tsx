"use client"

import { Bell } from 'lucide-react'

import { NotificationSettings } from '@/components/notifications'

export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
            <p className="text-muted-foreground">
              Manage how and when you receive notifications
            </p>
          </div>
        </div>
      </div>

      <NotificationSettings />
    </div>
  )
}
