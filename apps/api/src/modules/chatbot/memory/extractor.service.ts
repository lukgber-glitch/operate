import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Message } from '@prisma/client';
import { MemoryType, MemorySource, MemoryExtractionResult } from './memory.types';

/**
 * Memory Extractor Service
 * Uses Claude AI to extract important facts and context from conversations
 */
@Injectable()
export class MemoryExtractorService {
  private readonly logger = new Logger(MemoryExtractorService.name);
  private readonly claudeApiKey: string;
  private readonly claudeModel: string;

  constructor(private readonly configService: ConfigService) {
    this.claudeApiKey = this.configService.get<string>('ANTHROPIC_API_KEY', '');
    this.claudeModel = this.configService.get<string>(
      'CLAUDE_MODEL',
      'claude-3-5-sonnet-20241022',
    );
  }

  /**
   * Extract memories from conversation messages
   */
  async extractMemories(
    messages: Message[],
    userId: string,
    organizationId: string,
    conversationId?: string,
  ): Promise<MemoryExtractionResult> {
    try {
      // Build conversation text for analysis
      const conversationText = this.buildConversationText(messages);

      // Call Claude to extract memories
      const extractedMemories = await this.callClaudeForExtraction(conversationText);

      // Format and enrich memories
      const memories = extractedMemories.map((mem) => ({
        type: this.parseMemoryType(mem.type),
        content: mem.content,
        confidence: mem.confidence || 0.8,
        source: MemorySource.EXTRACTED,
        conversationId,
        metadata: {
          userId,
          organizationId,
          extractedAt: new Date().toISOString(),
        },
      }));

      // Calculate overall confidence
      const avgConfidence =
        memories.length > 0
          ? memories.reduce((sum, m) => sum + m.confidence, 0) / memories.length
          : 0;

      return {
        memories,
        confidence: avgConfidence,
      };
    } catch (error) {
      this.logger.error('Failed to extract memories', error);
      return {
        memories: [],
        confidence: 0,
      };
    }
  }

  /**
   * Build conversation text for extraction
   */
  private buildConversationText(messages: Message[]): string {
    return messages
      .map((msg) => {
        const role = msg.role === 'USER' ? 'User' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');
  }

  /**
   * Call Claude API to extract memories
   */
  private async callClaudeForExtraction(conversationText: string): Promise<
    Array<{
      type: string;
      content: string;
      confidence: number;
    }>
  > {
    const systemPrompt = this.buildExtractionPrompt();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.claudeModel,
          max_tokens: 2048,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Analyze this conversation and extract important memories:\n\n${conversationText}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Claude API error during extraction:', error);
        return [];
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Parse JSON response
      return this.parseExtractionResponse(content);
    } catch (error) {
      this.logger.error('Failed to call Claude for memory extraction', error);
      return [];
    }
  }

  /**
   * Build extraction prompt for Claude
   */
  private buildExtractionPrompt(): string {
    return `You are a memory extraction assistant. Your job is to analyze conversations and extract important information that should be remembered for future interactions.

Extract the following types of information:

1. PREFERENCE: User preferences about how they want things done
   Example: "User prefers detailed explanations", "User likes German language responses"

2. FACT: Important factual information about the user or their business
   Example: "Company uses SKR04 accounting standard", "Company has 5 employees"

3. INSTRUCTION: Explicit instructions from the user
   Example: "Always include VAT ID DE123456789 on invoices", "Use formal German (Sie form)"

4. CONTEXT: Business context and background information
   Example: "Main business is software consulting", "Company is based in Munich"

Return your response as a JSON array with this structure:
[
  {
    "type": "PREFERENCE|FACT|INSTRUCTION|CONTEXT",
    "content": "Clear, concise description of what to remember",
    "confidence": 0.0-1.0 (how confident you are this is important)
  }
]

Guidelines:
- Only extract information that would be useful to remember for future conversations
- Be specific and clear
- Confidence should be higher (0.9+) for explicit statements, lower (0.6-0.8) for implicit preferences
- Skip generic conversation fluff
- Maximum 5 memories per extraction
- Return empty array [] if nothing important to extract`;
  }

  /**
   * Parse extraction response from Claude
   */
  private parseExtractionResponse(content: string): Array<{
    type: string;
    content: string;
    confidence: number;
  }> {
    try {
      // Try to extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Validate structure
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item) => item.type && item.content)
            .map((item) => ({
              type: item.type,
              content: item.content,
              confidence: item.confidence || 0.8,
            }));
        }
      }
      return [];
    } catch (error) {
      this.logger.error('Failed to parse extraction response', error);
      return [];
    }
  }

  /**
   * Parse memory type from string
   */
  private parseMemoryType(type: string): MemoryType {
    const upperType = type.toUpperCase();
    switch (upperType) {
      case 'PREFERENCE':
        return MemoryType.PREFERENCE;
      case 'FACT':
        return MemoryType.FACT;
      case 'INSTRUCTION':
        return MemoryType.INSTRUCTION;
      case 'CONTEXT':
        return MemoryType.CONTEXT;
      default:
        return MemoryType.CONTEXT; // Default fallback
    }
  }

  /**
   * Check if memories conflict with existing ones
   */
  detectConflicts(
    newMemory: { type: MemoryType; content: string },
    existingMemories: Array<{ type: MemoryType; content: string }>,
  ): boolean {
    // Simple keyword-based conflict detection
    // In production, this could use semantic similarity
    const newKeywords = this.extractKeywords(newMemory.content);

    for (const existing of existingMemories) {
      if (existing.type === newMemory.type) {
        const existingKeywords = this.extractKeywords(existing.content);
        const overlap = newKeywords.filter((kw) => existingKeywords.includes(kw));

        // If significant overlap but different content, it's likely a conflict
        if (overlap.length > 1 && existing.content !== newMemory.content) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Extract keywords from memory content
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - lowercase and split
    return content
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);
  }
}
