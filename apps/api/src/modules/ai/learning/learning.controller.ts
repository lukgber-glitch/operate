/**
 * Learning Controller
 * API endpoints for AI learning from corrections
 */

import {
  Controller,
  Post,
  Get,
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
  ApiQuery,
} from '@nestjs/swagger';
import { CorrectionLearningService } from './correction-learning.service';
import {
  RecordCorrectionDto,
  ApplyLearningDto,
  CorrectionPatternDto,
  LearningAdjustmentDto,
  AccuracyStatsDto,
  GetPatternsQueryDto,
} from './dto/learning.dto';

@ApiTags('AI Learning')
@Controller('ai/learning')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
export class LearningController {
  constructor(private readonly learningService: CorrectionLearningService) {}

  @Post('corrections')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record a correction',
    description: 'Record a user correction to improve future classifications',
  })
  @ApiResponse({ status: 201, description: 'Correction recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async recordCorrection(@Body() dto: RecordCorrectionDto): Promise<{ success: boolean }> {
    await this.learningService.recordCorrection(dto);
    return { success: true };
  }

  @Post('apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apply learned patterns',
    description: 'Get learning-based suggestions for new data',
  })
  @ApiResponse({
    status: 200,
    description: 'Learning-based adjustments',
    type: [LearningAdjustmentDto],
  })
  async applyLearning(@Body() dto: ApplyLearningDto): Promise<LearningAdjustmentDto[]> {
    return this.learningService.applyLearning(dto);
  }

  @Get('patterns/:organisationId')
  @ApiOperation({
    summary: 'Get learning patterns',
    description: 'Get all learning patterns for an organization',
  })
  @ApiParam({ name: 'organisationId', description: 'Organisation ID' })
  @ApiQuery({ name: 'patternType', required: false, description: 'Filter by pattern type' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Only active patterns' })
  @ApiQuery({ name: 'minAccuracy', required: false, type: Number, description: 'Minimum accuracy' })
  @ApiQuery({ name: 'minOccurrences', required: false, type: Number, description: 'Minimum occurrences' })
  @ApiResponse({
    status: 200,
    description: 'Learning patterns',
    type: [CorrectionPatternDto],
  })
  async getPatterns(
    @Param('organisationId') organisationId: string,
    @Query() query: GetPatternsQueryDto,
  ): Promise<CorrectionPatternDto[]> {
    return this.learningService.getCorrectionPatterns(organisationId, query);
  }

  @Get('accuracy/:organisationId')
  @ApiOperation({
    summary: 'Get accuracy statistics',
    description: 'Get accuracy statistics and improvement metrics',
  })
  @ApiParam({ name: 'organisationId', description: 'Organisation ID' })
  @ApiResponse({
    status: 200,
    description: 'Accuracy statistics',
    type: AccuracyStatsDto,
  })
  async getAccuracyStats(
    @Param('organisationId') organisationId: string,
  ): Promise<AccuracyStatsDto> {
    return this.learningService.getAccuracyStats(organisationId);
  }

  @Post('patterns/:organisationId/prune')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Prune inaccurate patterns',
    description: 'Deactivate patterns with low accuracy',
  })
  @ApiParam({ name: 'organisationId', description: 'Organisation ID' })
  @ApiQuery({ name: 'minAccuracy', required: false, type: Number, description: 'Minimum accuracy threshold' })
  @ApiResponse({ status: 200, description: 'Number of patterns deactivated' })
  async prunePatterns(
    @Param('organisationId') organisationId: string,
    @Query('minAccuracy') minAccuracy?: number,
  ): Promise<{ deactivated: number }> {
    const deactivated = await this.learningService.pruneInaccuratePatterns(
      organisationId,
      minAccuracy,
    );
    return { deactivated };
  }
}
