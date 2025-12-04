import { IsString, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenerateFacturXDto } from './generate-facturx.dto';

export class FacturXPeppolOptionsDto {
  @ApiProperty({ default: true })
  @IsBoolean()
  sendViaPeppol: boolean;

  @ApiProperty({ example: '0002:12345678901234', description: 'Peppol participant ID' })
  @IsString()
  recipientParticipantId: string;

  @ApiPropertyOptional({ example: '0002', description: 'Peppol scheme (0002 = SIRET)' })
  @IsString()
  @IsOptional()
  recipientScheme?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  attachOriginalPdf?: boolean;
}

export class SendFacturXDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => GenerateFacturXDto)
  invoice: GenerateFacturXDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => FacturXPeppolOptionsDto)
  peppolOptions: FacturXPeppolOptionsDto;

  @ApiPropertyOptional({ example: 'org-uuid-123' })
  @IsString()
  @IsOptional()
  organizationId?: string;
}
