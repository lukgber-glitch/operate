import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ParseFacturXDto {
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  validateXml?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  parseToJson?: boolean;
}

export class ValidateFacturXDto {
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  validateSIRET?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  validateTVA?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  validateEN16931?: boolean;
}
