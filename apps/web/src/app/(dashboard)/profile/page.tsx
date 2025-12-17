'use client';

import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  MapPin,
  Shield,
  Settings,
  ArrowRight,
  Briefcase,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

export default function ProfilePage() {
  const { user, isLoading, orgId } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-white/70">No user data available</p>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email ? user.email[0]?.toUpperCase() || 'U' : 'U';
  };

  const getFullName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-white/70">
          View and manage your personal information
        </p>
      </div>

      {/* Profile Overview Card */}
      <GlassCard padding="lg">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            {/* Avatar and Basic Info */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" alt={getFullName()} />
                <AvatarFallback className="text-2xl text-white font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div>
                  <h2 className="text-2xl text-white font-bold">{getFullName()}</h2>
                  <div className="flex items-center gap-2 text-white/70">
                    <Badge variant="secondary" className="mt-1">
                      {user.role || 'User'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/settings/profile">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/settings/security">
                  <Shield className="mr-2 h-4 w-4" />
                  Security
                </Link>
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Contact Information Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/70">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              {orgId && (
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white/70">
                      Organization
                    </p>
                    <p className="font-medium">{orgId}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/70">Role</p>
                  <p className="font-medium capitalize">{user.role || 'User'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/70">
                    Member Since
                  </p>
                  <p className="font-medium">
                    {new Date().toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
      </GlassCard>

      {/* Quick Settings Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/settings/profile">
          <GlassCard className="cursor-pointer rounded-[16px] transition-colors hover:bg-accent">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Profile Settings</h3>
                  <p className="text-sm text-white/70">
                    Update your personal information and preferences
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-white/70" />
            </CardContent>
          </GlassCard>
        </Link>

        <Link href="/settings/security">
          <GlassCard className="cursor-pointer rounded-[16px] transition-colors hover:bg-accent">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Security Settings</h3>
                  <p className="text-sm text-white/70">
                    Manage passwords, 2FA, and active sessions
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-white/70" />
            </CardContent>
          </GlassCard>
        </Link>
      </div>

      {/* Account Status Card */}
      <GlassCard padding="lg">
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>Your account security and verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Email Verified</p>
                  <p className="text-sm text-white/70">
                    Your email address has been verified
                  </p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Verified
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-white/70">
                    Add an extra layer of security
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings/security">Configure</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </GlassCard>
    </div>
  );
}
