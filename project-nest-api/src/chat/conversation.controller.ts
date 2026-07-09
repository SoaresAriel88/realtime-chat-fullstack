import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ChatService } from './chat.service';

@SkipThrottle()
@Controller('conversations')
export class ConversationController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async findAll() {
    const conversations = await this.chatService.findAllConversations();

    return conversations.map((conversation) => {
      const lastMessage = conversation.messages[0];

      return {
        id: conversation.id,
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
  async getMessages(@Param('id') id: string) {
    const conversation = await this.chatService.findConversationById(id);

    if (!conversation) {
      throw new NotFoundException('Conversation não encontrada');
    }

    const messages = await this.chatService.getMessagesByConversationId(
      conversation.id,
    );

    return messages.map((message) => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      authorId: message.authorId,
      conversationId: message.conversationId,
      author: message.author,
    }));
  }

  @Post()
  async create(@Body() body: { name?: string }) {
    const name = body?.name?.trim();

    if (!name) {
      throw new BadRequestException('Nome da conversation é obrigatório');
    }

    const conversation = await this.chatService.roomCreate({ name });

    return {
      id: conversation.id,
      name: conversation.name,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }
}
