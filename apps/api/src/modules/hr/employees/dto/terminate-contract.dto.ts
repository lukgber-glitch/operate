import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

/**
 * DTO for terminating a contract
 */
export class TerminateContractDto {
  @ApiProperty({
    description: 'Contract end date (ISO 8601)',
    example: '2024-12-31',
  })
  @IsDateString()
  endDate: string;
}
