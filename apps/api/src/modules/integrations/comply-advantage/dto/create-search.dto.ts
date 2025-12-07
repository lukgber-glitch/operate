import { IsString, IsEnum, IsOptional, IsNumber, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { SearchType, MatchType } from '../types/comply-advantage.types';

/**
 * DTO for creating AML screening search
 */
export class CreateSearchDto {
  @IsString()
  searchTerm: string;

  searchType: SearchType;

  @IsOptional()
  @IsNumber()
  birthYear?: number;

  @IsOptional()
  @IsString()
  dateOfBirth?: string; // ISO date format

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsArray()
  matchTypes?: MatchType[];

  @IsOptional()
  @IsBoolean()
  exactMatch?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  fuzziness?: number; // 0.0 to 1.0, controls match sensitivity

  @IsOptional()
  @IsBoolean()
  removeDeceased?: boolean;

  @IsOptional()
  @IsString()
  userId?: string; // User being screened

  @IsString()
  organizationId: string;
}
