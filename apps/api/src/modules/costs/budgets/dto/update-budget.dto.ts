import { PartialType } from '@nestjs/swagger';
import { CreateBudgetDto } from './create-budget.dto';

/**
 * DTO for updating a budget
 * All fields are optional
 */
export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {}
