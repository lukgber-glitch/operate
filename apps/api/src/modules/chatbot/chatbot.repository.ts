import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ChatbotRepository {
  constructor(private prisma: PrismaService) {}

  async createConversation(data: {
    userId: string;
    orgId: string;
    title: string;
    context?: string;
  }) {
    return this.prisma.conversation.create({
      data: {
        userId: data.userId,
        orgId: data.orgId,
        title: data.title,
        contextType: data.context || 'general',
        status: 'ACTIVE',
      },
    });
  }

  async findConversationsByUser(userId: string, options: { limit: number; offset: number }) {
    return this.prisma.conversation.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { lastMessageAt: 'desc' },
      take: options.limit,
      skip: options.offset,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findConversationById(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async updateConversation(id: string, data: { lastMessageAt?: Date; title?: string }) {
    return this.prisma.conversation.update({
      where: { id },
      data,
    });
  }

  async createMessage(data: {
    conversationId: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    content: string;
    attachments?: string[];
    metadata?: Record<string, any>;
  }) {
    return this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        type: 'TEXT',
        content: data.content,
        // Store model and tokens from metadata if provided
        model: data.metadata?.model,
        tokens: data.metadata?.tokens?.input && data.metadata?.tokens?.output
          ? data.metadata.tokens.input + data.metadata.tokens.output
          : undefined,
      },
    });
  }

  async getMessageHistory(conversationId: string, limit = 20) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: {
        role: true,
        content: true,
      },
    });
  }
}
