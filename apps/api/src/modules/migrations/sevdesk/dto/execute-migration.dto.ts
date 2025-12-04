import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * DTO for executing migration
 */
export class ExecuteMigrationDto {
  @ApiProperty({
    description: 'Migration job ID from preview',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  jobId: string;
}
