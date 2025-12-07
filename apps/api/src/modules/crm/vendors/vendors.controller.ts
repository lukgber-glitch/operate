import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorFilterDto } from './dto/vendor-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permission } from '../../auth/rbac/permissions';

/**
 * Vendors Controller
 * Handles HTTP endpoints for vendor (suppliers) management
 */
@ApiTags('CRM - Vendors')
@Controller('organisations/:orgId/vendors')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  /**
   * List all vendors in organisation
   */
  @Get()
  @RequirePermissions(Permission.VENDORS_READ)
  @ApiOperation({
    summary: 'List vendors',
    description: 'Get paginated list of vendors with filters',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Vendors retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAll(
    @Param('orgId') orgId: string,
    @Query() query: VendorFilterDto,
  ) {
    return this.vendorsService.findAll(orgId, query);
  }

  /**
   * Get vendor statistics
   */
  @Get('statistics')
  @RequirePermissions(Permission.VENDORS_READ)
  @ApiOperation({
    summary: 'Get vendor statistics',
    description: 'Get vendor counts by status and top vendors by bill volume',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(@Param('orgId') orgId: string) {
    return this.vendorsService.getStatistics(orgId);
  }

  /**
   * Get single vendor by ID
   */
  @Get(':id')
  @RequirePermissions(Permission.VENDORS_READ)
  @ApiOperation({
    summary: 'Get vendor',
    description: 'Retrieve single vendor by ID with recent bills',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Vendor retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Vendor not found',
  })
  async findOne(@Param('id') id: string) {
    return this.vendorsService.findById(id);
  }

  /**
   * Create new vendor
   */
  @Post()
  @RequirePermissions(Permission.VENDORS_CREATE)
  @ApiOperation({
    summary: 'Create vendor',
    description: 'Create a new vendor/supplier',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Vendor created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Vendor with tax ID already exists',
  })
  async create(
    @Param('orgId') orgId: string,
    @Body() createVendorDto: CreateVendorDto,
  ) {
    return this.vendorsService.create(orgId, createVendorDto);
  }

  /**
   * Update vendor
   */
  @Patch(':id')
  @RequirePermissions(Permission.VENDORS_UPDATE)
  @ApiOperation({
    summary: 'Update vendor',
    description: 'Update vendor details',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Vendor updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
  })
  @ApiResponse({
    status: 404,
    description: 'Vendor not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Duplicate tax ID',
  })
  async update(
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
  ) {
    return this.vendorsService.update(id, updateVendorDto);
  }

  /**
   * Delete vendor
   */
  @Delete(':id')
  @RequirePermissions(Permission.VENDORS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete vendor',
    description:
      'Delete vendor (only if no associated bills, otherwise archive instead)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'Vendor deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete vendor with associated bills',
  })
  @ApiResponse({
    status: 404,
    description: 'Vendor not found',
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.vendorsService.delete(id);
  }

  /**
   * Archive vendor
   */
  @Post(':id/archive')
  @RequirePermissions(Permission.VENDORS_UPDATE)
  @ApiOperation({
    summary: 'Archive vendor',
    description: 'Mark vendor as inactive (soft delete)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Vendor archived successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Vendor is already archived',
  })
  @ApiResponse({
    status: 404,
    description: 'Vendor not found',
  })
  async archive(@Param('id') id: string) {
    return this.vendorsService.archive(id);
  }

  /**
   * Reactivate vendor
   */
  @Post(':id/reactivate')
  @RequirePermissions(Permission.VENDORS_UPDATE)
  @ApiOperation({
    summary: 'Reactivate vendor',
    description: 'Reactivate an archived vendor',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Vendor reactivated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Vendor is already active',
  })
  @ApiResponse({
    status: 404,
    description: 'Vendor not found',
  })
  async reactivate(@Param('id') id: string) {
    return this.vendorsService.reactivate(id);
  }
}
