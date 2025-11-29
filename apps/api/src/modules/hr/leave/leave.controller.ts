import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ApproveLeaveDto, RejectLeaveDto } from './dto/approve-leave.dto';
import { LeaveRequestResponseDto } from './dto/leave-request-response.dto';
import { LeaveBalanceDto } from './dto/leave-balance.dto';
import {
  LeaveQueryDto,
  LeaveCalendarQueryDto,
  CalendarEntryDto,
} from './dto/leave-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

/**
 * Controller for leave management endpoints
 */
@ApiTags('Leave Management')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  // ============================================================================
  // EMPLOYEE LEAVE REQUEST ENDPOINTS
  // ============================================================================

  @Get('employees/:employeeId/leave-requests')
  @ApiOperation({ summary: 'List leave requests for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  @ApiResponse({
    status: 200,
    description: 'Leave requests retrieved successfully',
    type: [LeaveRequestResponseDto],
  })
  async listEmployeeRequests(
    @Param('employeeId') employeeId: string,
    @Query() query: LeaveQueryDto,
  ) {
    const result = await this.leaveService.getEmployeeRequests(
      employeeId,
      query,
    );

    return {
      data: result.requests,
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: result.page * result.pageSize < result.total,
      },
    };
  }

  @Get('employees/:employeeId/leave-requests/:id')
  @ApiOperation({ summary: 'Get leave request details' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  @ApiParam({ name: 'id', description: 'Leave request UUID' })
  @ApiResponse({
    status: 200,
    description: 'Leave request retrieved successfully',
    type: LeaveRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async getLeaveRequest(
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
  ) {
    const request = await this.leaveService.getRequest(id);

    return {
      data: request,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('employees/:employeeId/leave-requests')
  @ApiOperation({ summary: 'Submit a new leave request' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  @ApiResponse({
    status: 201,
    description: 'Leave request created successfully',
    type: LeaveRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({
    status: 422,
    description: 'Business rule violation (overlapping request, insufficient balance, etc.)',
  })
  async submitLeaveRequest(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    const request = await this.leaveService.submitRequest(employeeId, dto);

    return {
      data: request,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete('employees/:employeeId/leave-requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a leave request' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  @ApiParam({ name: 'id', description: 'Leave request UUID' })
  @ApiResponse({ status: 204, description: 'Leave request cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  @ApiResponse({
    status: 422,
    description: 'Cannot cancel request (wrong status or not owned by employee)',
  })
  async cancelLeaveRequest(
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
  ) {
    await this.leaveService.cancelRequest(id, employeeId);
  }

  // ============================================================================
  // LEAVE BALANCE ENDPOINTS
  // ============================================================================

  @Get('employees/:employeeId/leave-balance')
  @ApiOperation({ summary: 'Get current leave balance for employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  @ApiResponse({
    status: 200,
    description: 'Leave balance retrieved successfully',
    type: LeaveBalanceDto,
  })
  async getLeaveBalance(@Param('employeeId') employeeId: string) {
    const balance = await this.leaveService.getBalance(employeeId);

    return {
      data: balance,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('employees/:employeeId/leave-balance/:year')
  @ApiOperation({ summary: 'Get leave balance for specific year' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  @ApiParam({ name: 'year', description: 'Calendar year', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Leave balance retrieved successfully',
    type: LeaveBalanceDto,
  })
  async getLeaveBalanceForYear(
    @Param('employeeId') employeeId: string,
    @Param('year') year: string,
  ) {
    const balance = await this.leaveService.getBalance(
      employeeId,
      parseInt(year, 10),
    );

    return {
      data: balance,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // ============================================================================
  // MANAGER / HR APPROVAL ENDPOINTS
  // ============================================================================

  @Post('leave-requests/:id/approve')
  @ApiOperation({ summary: 'Approve a leave request (Manager/HR)' })
  @ApiParam({ name: 'id', description: 'Leave request UUID' })
  @ApiResponse({
    status: 200,
    description: 'Leave request approved successfully',
    type: LeaveRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  @ApiResponse({
    status: 422,
    description: 'Cannot approve request (wrong status)',
  })
  async approveLeaveRequest(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') id: string,
    @Body() dto: ApproveLeaveDto,
  ) {
    const managerId = user.id;

    const request = await this.leaveService.approveRequest(
      id,
      managerId,
      dto.note,
    );

    return {
      data: request,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('leave-requests/:id/reject')
  @ApiOperation({ summary: 'Reject a leave request (Manager/HR)' })
  @ApiParam({ name: 'id', description: 'Leave request UUID' })
  @ApiResponse({
    status: 200,
    description: 'Leave request rejected successfully',
    type: LeaveRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  @ApiResponse({
    status: 422,
    description: 'Cannot reject request (wrong status)',
  })
  async rejectLeaveRequest(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') id: string,
    @Body() dto: RejectLeaveDto,
  ) {
    const managerId = user.id;

    const request = await this.leaveService.rejectRequest(
      id,
      managerId,
      dto.reason,
    );

    return {
      data: request,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // ============================================================================
  // ORGANISATION-LEVEL ENDPOINTS
  // ============================================================================

  @Get('organisations/:orgId/leave-requests')
  @ApiOperation({ summary: 'Get all leave requests for organisation' })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiResponse({
    status: 200,
    description: 'Leave requests retrieved successfully',
    type: [LeaveRequestResponseDto],
  })
  async getOrganisationRequests(
    @Param('orgId') orgId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.leaveService.getPendingForOrganisation(
      orgId,
      page,
      pageSize,
    );

    return {
      data: result.requests,
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: result.page * result.pageSize < result.total,
      },
    };
  }

  @Get('organisations/:orgId/leave-requests/pending')
  @ApiOperation({ summary: 'Get pending leave requests for organisation' })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiResponse({
    status: 200,
    description: 'Pending leave requests retrieved successfully',
    type: [LeaveRequestResponseDto],
  })
  async getPendingRequests(
    @Param('orgId') orgId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.leaveService.getPendingForOrganisation(
      orgId,
      page,
      pageSize,
    );

    return {
      data: result.requests,
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: result.page * result.pageSize < result.total,
      },
    };
  }

  @Get('organisations/:orgId/leave-calendar')
  @ApiOperation({ summary: 'Get team leave calendar for organisation' })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiResponse({
    status: 200,
    description: 'Leave calendar retrieved successfully',
    type: [CalendarEntryDto],
  })
  async getLeaveCalendar(
    @Param('orgId') orgId: string,
    @Query() query: LeaveCalendarQueryDto,
  ) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const calendar = await this.leaveService.getTeamCalendar(
      orgId,
      startDate,
      endDate,
    );

    return {
      data: calendar,
      meta: {
        timestamp: new Date().toISOString(),
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    };
  }
}
