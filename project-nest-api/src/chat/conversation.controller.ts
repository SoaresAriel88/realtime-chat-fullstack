import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@SkipThrottle()
@Controller('conversations')
export class ConversationController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async findAll(@Req() req: any) {
    const tenantId: string = req.user.tenantId;

    const conversations = await this.chatService.findAllConversations(tenantId);

    return conversations.map((conversation) => {
      const lastMessage = conversation.messages[0];

      return {
        id: conversation.id,
        tenantId: conversation.tenantId,
        name: conversation.name,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              authorName: lastMessage.author.name,
            }
          : undefined,
      };
    });
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string, @Req() req: any) {
    const tenantId: string = req.user.tenantId;
    const conversation = await this.chatService.findConversationById(
      tenantId,
      id,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation não encontrada');
    }

    const messages = await this.chatService.getMessagesByConversationId(
      tenantId,
      conversation.id,
    );

    return messages.map((message) => ({
      id: message.id,
      tenantId: conversation.tenantId,
      content: message.content,
      createdAt: message.createdAt,
      authorId: message.authorId,
      conversationId: message.conversationId,
      author: message.author,
    }));
  }

  @Post()
  async create(@Body() body: { name?: string }, @Req() req: any) {
    const name = body?.name?.trim();
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant inválido');
    }

    if (!name) {
      throw new BadRequestException('Nome da conversation é obrigatório');
    }

    const conversation = await this.chatService.roomCreate({ name, tenantId });

    return {
      id: conversation.id,
      tenantId: conversation.tenantId,
      name: conversation.name,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }
}
