import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateInvoiceDto {
  @ApiProperty({ description: 'Array of time entry IDs to include in invoice' })
  @IsArray()
  @IsString({ each: true })
  entryIds: string[];
}
