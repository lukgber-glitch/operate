/**
 * Base Context Provider
 * Abstract base class for all entity context providers
 */

import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { EntityContext, ContextProviderInterface } from '../context.types';

export abstract class BaseContextProvider implements ContextProviderInterface {
  protected readonly logger: Logger;
  abstract entityType: string;

  constructor(protected readonly prisma: PrismaService) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Get full context for an entity
   */
  async getContext(entityId: string, orgId: string): Promise<EntityContext> {
    try {
      const entity = await this.fetchEntity(entityId, orgId);

      if (!entity) {
        throw new Error(`${this.entityType} not found: ${entityId}`);
      }

      const summary = this.getSummary(entity);
      const data = this.getRelevantFields(entity);
      const relatedEntities = await this.getRelatedEntities(entity, orgId);

      return {
        type: this.entityType,
        id: entityId,
        summary,
        data,
        relatedEntities,
        metadata: this.getMetadata(entity),
      };
    } catch (error) {
      this.logger.error(`Error getting context for ${this.entityType}:`, error);
      throw error;
    }
  }

  /**
   * Fetch entity from database - must be implemented by subclass
   */
  protected abstract fetchEntity(entityId: string, orgId: string): Promise<any>;

  /**
   * Generate human-readable summary - must be implemented by subclass
   */
  abstract getSummary(entity: any): string;

  /**
   * Extract only relevant fields - must be implemented by subclass
   */
  abstract getRelevantFields(entity: any): Record<string, any>;

  /**
   * Get suggested actions for this entity
   */
  abstract getSuggestedActions(entity: any): string[];

  /**
   * Get related entities (optional, can be overridden)
   */
  protected async getRelatedEntities(
    entity: any,
    orgId: string,
  ): Promise<Array<{ type: string; id: string; relation: string }>> {
    return [];
  }

  /**
   * Get additional metadata (optional, can be overridden)
   */
  protected getMetadata(entity: any): Record<string, any> {
    return {};
  }

  /**
   * Format currency amount
   */
  protected formatCurrency(amount: number | string, currency: string = 'EUR'): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(numAmount);
  }

  /**
   * Format date
   */
  protected formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Calculate days difference
   */
  protected daysDifference(date: Date | string, from: Date = new Date()): number {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const diffTime = dateObj.getTime() - from.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
