import { Injectable } from '@nestjs/common';
import { Conversation } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async roomCreate(data: { name: string }): Promise<Conversation> {
    if (!data.name) {
      throw new Error('Nome da sala é obrigatório');
    }
    return await this.prisma.conversation.create({ data: data });
  }
  async findRoomByName(name: string) {
    return await this.prisma.conversation.findFirst({
      where: {
        name,
      },
    });
  }

  async findConversationById(id: string) {
    return await this.prisma.conversation.findUnique({
      where: { id },
    });
  }

  async findAllConversations() {
    return await this.prisma.conversation.findMany({
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

  async getMessagesByConversationId(conversationId: string) {
    return await this.prisma.message.findMany({
      where: { conversationId },
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
    authorId: string;
    content: string;
  }) {
    const conversationId = data.conversationId?.trim();
    const authorId = data.authorId?.trim();
    const content = data.content?.trim();

    if (!conversationId) {
      throw new Error('ID da conversa é obrigatório');
    }

    if (!authorId) {
      throw new Error('ID do autor é obrigatório');
    }

    if (!content) {
      throw new Error('Mensagem vazia');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation não encontrada');
    }

    return await this.prisma.message.create({
      data: {
        content,
        conversation: {
          connect: {
            id: conversationId,
          },
        },
        author: {
          connect: {
            id: authorId,
          },
        },
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
  async findRoomByIdOrName(identifier: string) {
    return await this.prisma.conversation.findFirst({
      where: {
        OR: [{ id: identifier }, { name: identifier }],
      },
    });
  }
}
