import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectActionDto {
  @ApiProperty({ description: 'Reason for rejecting the action' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
