// Global type declarations for the API module
// This re-exports Prisma types globally to fix import issues

import { Prisma as PrismaTypes } from '@prisma/client';

declare global {
  namespace Prisma {
    type InputJsonValue = PrismaTypes.InputJsonValue;
    type JsonValue = PrismaTypes.JsonValue;
    type JsonObject = PrismaTypes.JsonObject;
    type JsonArray = PrismaTypes.JsonArray;
  }
}

export {};
