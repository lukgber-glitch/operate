"use client"

import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'

import { fadeUp, staggerContainer } from '@/lib/animation-variants'
import { NotificationSettings } from '@/components/notifications'

export default function NotificationsSettingsPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
            <p className="text-white/70">
              Manage how and when you receive notifications
            </p>
          </div>
        </div>
      </motion.div>

      {/* Settings */}
      <motion.div variants={fadeUp}>
        <NotificationSettings />
      </motion.div>
    </motion.div>
  )
}
