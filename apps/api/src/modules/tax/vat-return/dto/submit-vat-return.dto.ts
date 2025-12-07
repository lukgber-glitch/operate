import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitVatReturnDto {
  @ApiProperty({
    description: 'ELSTER transfer ticket number',
    example: 'TT-2025-001-ABC123',
  })
  @IsString()
  @IsNotEmpty()
  transferTicket: string;

  @ApiPropertyOptional({
    description: 'ELSTER receipt ID',
    example: 'REC-2025-001-XYZ',
  })
  @IsString()
  @IsOptional()
  receiptId?: string;
}
