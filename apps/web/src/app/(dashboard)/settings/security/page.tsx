'use client';

import { motion } from 'framer-motion';
import { Shield, Key, Smartphone, Monitor, Activity, AlertTriangle, Save, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import { Button } from '@/components/ui/button';
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Mock active sessions
const activeSessions = [
  {
    id: '1',
    device: 'Chrome on Windows',
    location: 'Berlin, Germany',
    ip: '192.168.1.100',
    lastActive: '2 minutes ago',
    current: true,
  },
  {
    id: '2',
    device: 'Safari on iPhone',
    location: 'Berlin, Germany',
    ip: '192.168.1.101',
    lastActive: '2 hours ago',
    current: false,
  },
  {
    id: '3',
    device: 'Firefox on MacOS',
    location: 'Munich, Germany',
    ip: '192.168.2.50',
    lastActive: '1 day ago',
    current: false,
  },
];

export default function SecuritySettingsPage() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [suspiciousActivityAlerts, setSuspiciousActivityAlerts] = useState(true);

  const handlePasswordChange = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all password fields.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Password updated',
      description: 'Your password has been changed successfully.',
    });

    // Clear form
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleEnableTwoFactor = () => {
    if (!twoFactorEnabled) {
      toast({
        title: 'Two-Factor Authentication',
        description: 'Please scan the QR code with your authenticator app.',
      });
    } else {
      toast({
        title: 'Two-Factor Authentication',
        description: 'Two-factor authentication has been disabled.',
      });
    }
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  const handleRevokeSession = (sessionId: string) => {
    toast({
      title: 'Session revoked',
      description: 'The session has been terminated successfully.',
    });
  };

  const handleRevokeAllSessions = () => {
    toast({
      title: 'All sessions revoked',
      description: 'All other sessions have been terminated. You will need to log in again on those devices.',
    });
  };

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
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
            <p className="text-white/70">
              Manage your account security and authentication
            </p>
          </div>
        </div>
      </motion.div>

      {/* Password Change */}
      <motion.div variants={fadeUp}>
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <GlassCardTitle>Change Password</GlassCardTitle>
          </div>
          <GlassCardDescription>
            Update your password to keep your account secure
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-white/70">
                Must be at least 8 characters with a mix of letters, numbers, and symbols
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handlePasswordChange}>
              <Save className="mr-2 h-4 w-4" />
              Update Password
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>
      </motion.div>

      {/* Two-Factor Authentication */}
      <motion.div variants={fadeUp}>
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            <GlassCardTitle>Two-Factor Authentication</GlassCardTitle>
          </div>
          <GlassCardDescription>
            Add an extra layer of security to your account
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="2fa-toggle">Enable Two-Factor Authentication</Label>
              <p className="text-sm text-white/70">
                Require a verification code in addition to your password
              </p>
            </div>
            <div className="flex items-center gap-3">
              {twoFactorEnabled && (
                <Badge variant="default" className="bg-green-600">
                  Enabled
                </Badge>
              )}
              <Switch
                id="2fa-toggle"
                checked={twoFactorEnabled}
                onCheckedChange={handleEnableTwoFactor}
              />
            </div>
          </div>

          {twoFactorEnabled && (
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is active. You will be prompted for a verification code when logging in from a new device.
              </AlertDescription>
            </Alert>
          )}

          {!twoFactorEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Enable two-factor authentication to significantly improve your account security.
              </AlertDescription>
            </Alert>
          )}
        </GlassCardContent>
      </GlassCard>
      </motion.div>

      {/* Security Alerts */}
      <motion.div variants={fadeUp}>
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <GlassCardTitle>Security Alerts</GlassCardTitle>
          </div>
          <GlassCardDescription>
            Get notified about important security events
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="login-notifications">Login Notifications</Label>
                <p className="text-sm text-white/70">
                  Get notified when your account is accessed from a new device
                </p>
              </div>
              <Switch
                id="login-notifications"
                checked={loginNotifications}
                onCheckedChange={setLoginNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="suspicious-activity">Suspicious Activity Alerts</Label>
                <p className="text-sm text-white/70">
                  Receive alerts about unusual account activity
                </p>
              </div>
              <Switch
                id="suspicious-activity"
                checked={suspiciousActivityAlerts}
                onCheckedChange={setSuspiciousActivityAlerts}
              />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
      </motion.div>

      {/* Active Sessions */}
      <motion.div variants={fadeUp}>
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                <GlassCardTitle>Active Sessions</GlassCardTitle>
              </div>
              <GlassCardDescription>
                Manage devices that are currently logged into your account
              </GlassCardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRevokeAllSessions}>
              Revoke All
            </Button>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between border-b border-slate-200 pb-4 last:border-0 last:pb-0 dark:border-slate-700"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{session.device}</h4>
                    {session.current && (
                      <Badge variant="default" className="bg-green-600">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-white/70">
                    {session.location} • {session.ip}
                  </p>
                  <p className="text-xs text-white/70">
                    Last active: {session.lastActive}
                  </p>
                </div>

                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>
      </motion.div>

      {/* Save Button */}
      <motion.div variants={fadeUp} className="flex justify-end">
        <Button size="lg" onClick={() => toast({ title: 'Settings saved', description: 'Your security settings have been updated.' })}>
          <Save className="mr-2 h-4 w-4" />
          Save Security Settings
        </Button>
      </motion.div>
    </motion.div>
  );
}
