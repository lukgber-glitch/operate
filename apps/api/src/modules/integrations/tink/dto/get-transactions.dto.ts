import { IsString, IsOptional, IsDateString } from 'class-validator';

/**
 * DTO for fetching transactions
 */
export class GetTransactionsDto {
  @IsString()
  organizationId: string;

  @IsString()
  userId: string;

  @IsString()
  accountId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
