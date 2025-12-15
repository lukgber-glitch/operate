'use client';

import { motion } from 'framer-motion';
import { User, Camera, Mail, Phone, Building2, Calendar, MapPin, Save } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock user data
const initialUserData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'luk.gber@gmail.com',
  phone: '+49 30 12345678',
  jobTitle: 'CEO',
  department: 'Executive',
  bio: 'Passionate about streamlining business operations through automation.',
  location: 'Berlin, Germany',
  timezone: 'Europe/Berlin',
  language: 'en',
  dateFormat: 'DD/MM/YYYY',
  avatarUrl: '',
};

export default function ProfileSettingsPage() {
  const [userData, setUserData] = useState(initialUserData);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleSaveProfile = () => {
    toast({
      title: 'Profile updated',
      description: 'Your profile settings have been saved successfully.',
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      toast({
        title: 'Avatar uploaded',
        description: 'Your profile picture has been updated.',
      });
    }
  };

  const getInitials = () => {
    return `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase();
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
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
            <p className="text-white/70">
              Manage your personal information and preferences
            </p>
          </div>
        </div>
      </motion.div>

      {/* Avatar Upload */}
      <motion.div variants={fadeUp}>
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Profile Picture</GlassCardTitle>
          <GlassCardDescription>
            Upload a photo to personalize your account
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview || userData.avatarUrl} />
              <AvatarFallback className="text-2xl text-white">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 hover:bg-accent hover:text-accent-foreground">
                  <Camera className="h-4 w-4" />
                  <span className="text-sm font-medium">Upload Photo</span>
                </div>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </Label>
              <p className="text-xs text-white/70">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
      </motion.div>

      {/* Personal Information */}
      <motion.div variants={fadeUp}>
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Personal Information</GlassCardTitle>
          <GlassCardDescription>
            Update your personal details and contact information
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={userData.firstName}
                onChange={(e) =>
                  setUserData({ ...userData, firstName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={userData.lastName}
                onChange={(e) =>
                  setUserData({ ...userData, lastName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </div>
              </Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-white/70">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </div>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={userData.phone}
                onChange={(e) =>
                  setUserData({ ...userData, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-title">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Job Title
                </div>
              </Label>
              <Input
                id="job-title"
                value={userData.jobTitle}
                onChange={(e) =>
                  setUserData({ ...userData, jobTitle: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={userData.department}
                onChange={(e) =>
                  setUserData({ ...userData, department: e.target.value })
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </div>
              </Label>
              <Input
                id="location"
                value={userData.location}
                onChange={(e) =>
                  setUserData({ ...userData, location: e.target.value })
                }
                placeholder="City, Country"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={userData.bio}
                onChange={(e) =>
                  setUserData({ ...userData, bio: e.target.value })
                }
                placeholder="Tell us a bit about yourself..."
                rows={3}
              />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
      </motion.div>

      {/* Preferences */}
      <motion.div variants={fadeUp}>
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Preferences</GlassCardTitle>
          <GlassCardDescription>
            Customize your account preferences
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timezone
                </div>
              </Label>
              <Select
                value={userData.timezone}
                onValueChange={(value) =>
                  setUserData({ ...userData, timezone: value })
                }
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Berlin">Europe/Berlin (CET)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                  <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los Angeles (PST)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={userData.language}
                onValueChange={(value) =>
                  setUserData({ ...userData, language: value })
                }
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <Select
                value={userData.dateFormat}
                onValueChange={(value) =>
                  setUserData({ ...userData, dateFormat: value })
                }
              >
                <SelectTrigger id="date-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
      </motion.div>

      {/* Save Button */}
      <motion.div variants={fadeUp} className="flex justify-end">
        <Button onClick={handleSaveProfile} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </motion.div>
    </motion.div>
  );
}
