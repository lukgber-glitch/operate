import { PartialType } from '@nestjs/swagger';
import { CreateQuoteDto } from './create-quote.dto';

/**
 * DTO for updating a quote
 * All fields from CreateQuoteDto are optional
 */
export class UpdateQuoteDto extends PartialType(CreateQuoteDto) {}
