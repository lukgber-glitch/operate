import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SuggestionsService } from './suggestions.service';
import {
  SuggestionDto,
  ContextDto,
  ApplySuggestionDto,
  DismissSuggestionDto,
  GetSuggestionsQueryDto,
  SuggestionPriority,
} from './dto/suggestions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
/**
 * Request object with user context
 */
interface AuthenticatedRequest {
  user: {
    id: string;
    orgId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Suggestions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get suggestions for current context' })
  @ApiQuery({
    name: 'context',
    required: false,
    description: 'Context path (e.g., finance.invoices)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of suggestions (default: 5)',
  })
  @ApiQuery({
    name: 'minPriority',
    required: false,
    enum: SuggestionPriority,
    description: 'Minimum priority level',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns context-aware suggestions',
    type: [SuggestionDto],
  })
  async getSuggestions(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetSuggestionsQueryDto,
    @Body() context?: ContextDto,
  ): Promise<SuggestionDto[]> {
    const { orgId, id: userId } = req.user;

    return this.suggestionsService.getSuggestions(
      orgId,
      userId,
      context,
      query.limit || 5,
      query.minPriority,
    );
  }

  @Get(':context')
  @ApiOperation({ summary: 'Get suggestions by page context' })
  @ApiParam({
    name: 'context',
    description: 'Context path (e.g., finance.invoices)',
    example: 'finance.invoices',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of suggestions (default: 5)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns suggestions for specific context',
    type: [SuggestionDto],
  })
  async getSuggestionsByContext(
    @Req() req: AuthenticatedRequest,
    @Param('context') contextPath: string,
    @Query('limit') limit?: number,
  ): Promise<SuggestionDto[]> {
    const { orgId, id: userId } = req.user;

    return this.suggestionsService.getSuggestionsByContext(
      orgId,
      userId,
      contextPath,
      limit || 5,
    );
  }

  @Post(':id/apply')
  @ApiOperation({ summary: 'Execute suggestion action' })
  @ApiParam({
    name: 'id',
    description: 'Suggestion ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Suggestion applied successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        result: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Suggestion not found',
  })
  async applySuggestion(
    @Req() req: AuthenticatedRequest,
    @Param('id') suggestionId: string,
    @Body() dto: ApplySuggestionDto,
  ): Promise<{ success: boolean; result?: any }> {
    const { orgId, id: userId } = req.user;

    return this.suggestionsService.applySuggestion(
      suggestionId,
      orgId,
      userId,
      dto.params,
    );
  }

  @Post(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss suggestion' })
  @ApiParam({
    name: 'id',
    description: 'Suggestion ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Suggestion dismissed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Suggestion not found',
  })
  async dismissSuggestion(
    @Req() req: AuthenticatedRequest,
    @Param('id') suggestionId: string,
    @Body() dto: DismissSuggestionDto,
  ): Promise<{ success: boolean }> {
    const { orgId, id: userId } = req.user;

    await this.suggestionsService.dismissSuggestion(
      suggestionId,
      orgId,
      userId,
      dto.reason,
    );

    return { success: true };
  }

  @Post(':id/viewed')
  @ApiOperation({ summary: 'Mark suggestion as viewed' })
  @ApiParam({
    name: 'id',
    description: 'Suggestion ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Suggestion marked as viewed',
  })
  async markAsViewed(
    @Req() req: AuthenticatedRequest,
    @Param('id') suggestionId: string,
  ): Promise<{ success: boolean }> {
    const { orgId } = req.user;

    await this.suggestionsService.markAsViewed(suggestionId, orgId);

    return { success: true };
  }
}
