import { Injectable } from '@nestjs/common';
import { Conversation } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async roomCreate(data: {
    name: string;
    tenantId: string;
  }): Promise<Conversation> {
    if (!data.tenantId) {
      throw new Error('Tenant inválido');
    }
    if (!data.name) {
      throw new Error('Nome da sala é obrigatório');
    }
    const conversation = await this.prisma.conversation.create({
      data: {
        name: data.name,
        tenant: {
          connect: {
            id: data.tenantId,
          },
        },
      },
    });
    return conversation;
  }
  async findRoomByName(tenantId: string, name: string) {
    return await this.prisma.conversation.findFirst({
      where: {
        tenantId,
        name,
      },
    });
  }

  async findConversationById(tenantId: string, id: string) {
    return await this.prisma.conversation.findFirst({
      where: { tenantId, id },
    });
  }

  async findAllConversations(tenantId: string) {
    return await this.prisma.conversation.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            author: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async getMessagesByConversationId(tenantId: string, conversationId: string) {
    return await this.prisma.message.findMany({
      where: { tenantId, conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });
  }
  async saveMessageByConversation(data: {
    conversationId: string;
    tenantId: string;
    authorId: string;
    content: string;
  }) {
    const conversationId = data.conversationId?.trim();
    const tenantId = data.tenantId?.trim();
    const authorId = data.authorId?.trim();
    const content = data.content?.trim();

    if (!tenantId) {
      throw new Error('ID da empresa é obrigatório');
    }

    if (!conversationId) {
      throw new Error('ID da conversa é obrigatório');
    }

    if (!authorId) {
      throw new Error('ID do autor é obrigatório');
    }

    if (!content) {
      throw new Error('Mensagem vazia');
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        tenantId: tenantId,
        id: conversationId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation não encontrada');
    }

    return await this.prisma.message.create({
      data: {
        content,
        tenantId,
        conversationId,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
  async findRoomByIdOrName(identifier: string, tenantId: string) {
    return await this.prisma.conversation.findFirst({
      where: {
        AND: [{ tenantId: tenantId }, { name: identifier }],
      },
    });
  }
}
