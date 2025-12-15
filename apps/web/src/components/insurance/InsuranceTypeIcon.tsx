'use client';

import {
  Shield,
  ShieldCheck,
  Building,
  Heart,
  Smartphone,
  Car,
  Users,
  HardHat,
  FileText,
} from 'lucide-react';

import { InsuranceType } from '@/hooks/use-insurance';

interface InsuranceTypeIconProps {
  type: InsuranceType;
  className?: string;
}

export function InsuranceTypeIcon({ type, className = 'h-5 w-5' }: InsuranceTypeIconProps) {
  switch (type) {
    case 'LIABILITY':
      return <Shield className={className} />;
    case 'PROFESSIONAL_INDEMNITY':
      return <ShieldCheck className={className} />;
    case 'PROPERTY':
      return <Building className={className} />;
    case 'HEALTH':
      return <Heart className={className} />;
    case 'CYBER':
      return <Smartphone className={className} />;
    case 'VEHICLE':
      return <Car className={className} />;
    case 'DIRECTORS_OFFICERS':
      return <Users className={className} />;
    case 'WORKERS_COMPENSATION':
      return <HardHat className={className} />;
    default:
      return <FileText className={className} />;
  }
}

export function getInsuranceTypeLabel(type: InsuranceType): string {
  switch (type) {
    case 'LIABILITY':
      return 'Liability';
    case 'PROFESSIONAL_INDEMNITY':
      return 'Professional Indemnity';
    case 'PROPERTY':
      return 'Property';
    case 'HEALTH':
      return 'Health';
    case 'CYBER':
      return 'Cyber Liability';
    case 'VEHICLE':
      return 'Vehicle';
    case 'DIRECTORS_OFFICERS':
      return 'Directors & Officers';
    case 'WORKERS_COMPENSATION':
      return 'Workers Compensation';
    case 'OTHER':
      return 'Other';
  }
}

export function getInsuranceTypeColor(type: InsuranceType): string {
  switch (type) {
    case 'LIABILITY':
      return 'bg-blue-500/20 text-blue-400';
    case 'PROFESSIONAL_INDEMNITY':
      return 'bg-purple-500/20 text-purple-400';
    case 'PROPERTY':
      return 'bg-green-500/20 text-green-400';
    case 'HEALTH':
      return 'bg-pink-500/20 text-pink-400';
    case 'CYBER':
      return 'bg-cyan-500/20 text-cyan-400';
    case 'VEHICLE':
      return 'bg-orange-500/20 text-orange-400';
    case 'DIRECTORS_OFFICERS':
      return 'bg-indigo-500/20 text-indigo-400';
    case 'WORKERS_COMPENSATION':
      return 'bg-yellow-500/20 text-yellow-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}
