import { IsString } from 'class-validator';

/**
 * DTO for completing Tink authorization (callback)
 */
export class CompleteAuthorizationDto {
  @IsString()
  code: string;

  @IsString()
  state: string;
}
