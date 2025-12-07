import { PartialType } from '@nestjs/swagger';
import { CreateVendorDto } from './create-vendor.dto';

/**
 * DTO for updating an existing vendor
 * All fields from CreateVendorDto are optional for updates
 */
export class UpdateVendorDto extends PartialType(CreateVendorDto) {}
