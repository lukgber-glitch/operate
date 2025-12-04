/**
 * User-related types for the Operate platform
 */

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export interface UserBasic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  locale?: string;
}

export interface UserWithRole extends UserBasic {
  role: Role;
}
