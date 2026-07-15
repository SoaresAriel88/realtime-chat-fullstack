import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/database/prisma.service';
import { ConversationController } from './conversation.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [JwtModule],
  controllers: [ConversationController],
  providers: [ChatGateway, ChatService, PrismaService],
})
export class ChatModule {}
