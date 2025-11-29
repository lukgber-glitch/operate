import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';

/**
 * RBAC Module
 * Provides Role-Based Access Control services
 *
 * This module exports RbacService for use throughout the application
 * to check permissions and roles for authenticated users.
 *
 * @example
 * // Import in other modules
 * @Module({
 *   imports: [RbacModule],
 *   controllers: [MyController],
 * })
 * export class MyModule {}
 */
@Module({
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}
