import { IsString, IsOptional, IsIn } from 'class-validator';
import { TINK_MARKETS, TinkMarket } from '../tink.config';

/**
 * DTO for starting Tink authorization flow
 */
export class StartAuthorizationDto {
  @IsString()
  organizationId: string;

  @IsString()
  userId: string;

  @IsOptional()
  @IsIn(TINK_MARKETS)
  market?: TinkMarket;

  @IsOptional()
  @IsString()
  locale?: string;
}
