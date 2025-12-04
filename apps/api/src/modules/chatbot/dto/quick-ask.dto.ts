/**
 * Quick Ask DTO
 * For one-off questions without saving to conversation history
 */

import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuickAskDto {
  @ApiProperty({
    description: 'The question to ask the AI assistant',
    example: 'What is the current VAT rate in Germany?',
  })
  @IsNotEmpty()
  @IsString()
  question: string;

  @ApiPropertyOptional({
    description: 'Optional context for the question',
    example: 'invoice',
    enum: ['invoice', 'expense', 'tax', 'payroll', 'general'],
  })
  @IsOptional()
  @IsString()
  context?: string;
}

export class QuickAskResponseDto {
  @ApiProperty({
    description: 'The AI assistant response',
    example: 'The standard VAT rate in Germany is 19%...',
  })
  answer: string;

  @ApiProperty({
    description: 'Model used for the response',
    example: 'claude-3-5-sonnet-20241022',
  })
  model: string;

  @ApiProperty({
    description: 'Token count for the request and response',
    example: { input: 50, output: 120 },
  })
  usage: {
    input: number;
    output: number;
  };
}
