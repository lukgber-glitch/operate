import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveVatReturnDto {
  @ApiProperty({
    description: 'User ID of the approver',
    example: 'user_123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'Optional approval notes',
    example: 'Reviewed and approved for submission',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
