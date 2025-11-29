/**
 * HR-related types for the Operate platform
 */

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
  PENDING = 'PENDING',
}

export enum ContractType {
  PERMANENT = 'PERMANENT',
  FIXED_TERM = 'FIXED_TERM',
  PART_TIME = 'PART_TIME',
  MINIJOB = 'MINIJOB',
  MIDIJOB = 'MIDIJOB',
  FREELANCE = 'FREELANCE',
  INTERNSHIP = 'INTERNSHIP',
  APPRENTICESHIP = 'APPRENTICESHIP',
}

export enum LeaveType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  PARENTAL = 'PARENTAL',
  UNPAID = 'UNPAID',
  SPECIAL = 'SPECIAL',
  TRAINING = 'TRAINING',
}

export enum LeaveRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface LeaveBalance {
  leaveType: LeaveType;
  totalDays: number;
  usedDays: number;
  availableDays: number;
  carriedOver?: number;
}
