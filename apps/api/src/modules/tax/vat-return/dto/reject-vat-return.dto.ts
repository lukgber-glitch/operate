import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RejectVatReturnDto {
  @ApiProperty({
    description: 'Rejection reason from ELSTER',
    example: 'Invalid tax number format',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'ELSTER error code',
    example: 'ERR_TAX_NUMBER_INVALID',
  })
  @IsString()
  @IsOptional()
  errorCode?: string;
}
