import { PartialType } from '@nestjs/swagger';
import { CreateMileageEntryDto } from './create-mileage-entry.dto';

/**
 * DTO for updating a mileage entry
 */
export class UpdateMileageEntryDto extends PartialType(CreateMileageEntryDto) {}
