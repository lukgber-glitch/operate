/**
 * Prisma Query Event Types
 * Proper TypeScript types for Prisma query events
 */

export interface PrismaQueryEvent {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}

export interface PrismaRawQueryResult {
  [key: string]: unknown;
}
