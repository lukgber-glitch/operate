/**
 * Cancel IRN DTO
 *
 * Data Transfer Object for IRN cancellation requests
 */

import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CancelIrnDto {
  @IsNotEmpty()
  @IsString()
  irn: string;

  @IsNotEmpty()
  @IsIn(['1', '2', '3', '4'])
  cnlRsn: string; // 1: Duplicate, 2: Data entry mistake, 3: Order cancelled, 4: Others

  @IsNotEmpty()
  @IsString()
  cnlRem: string; // Cancellation remarks
}
