import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVatReturnDto {
  @ApiProperty({
    description: 'Organization ID',
    example: 'org_123',
  })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({
    description: 'Period in format YYYY-QN (quarterly), YYYY-MM (monthly), or YYYY (yearly)',
    example: '2025-Q1',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\d{4}-(Q[1-4]|\d{2})|\d{4})$/, {
    message: 'Period must be in format YYYY-QN, YYYY-MM, or YYYY',
  })
  period: string;
}
