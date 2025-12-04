import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RenewZatcaCertificateDto {
  @ApiPropertyOptional({
    description: 'One-Time Password from ZATCA portal for production renewal',
    example: '123456',
  })
  @IsString()
  @IsOptional()
  otp?: string;

  @ApiPropertyOptional({
    description: 'Reason for renewal',
    example: 'Certificate expiring soon',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Auto-activate new certificate after approval',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  autoActivate?: boolean;
}
