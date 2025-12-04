import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Validate Peppol Participant DTO
 */
export class ValidateParticipantDto {
  @IsString()
  @IsNotEmpty()
  scheme: string;

  @IsString()
  @IsNotEmpty()
  identifier: string;
}
