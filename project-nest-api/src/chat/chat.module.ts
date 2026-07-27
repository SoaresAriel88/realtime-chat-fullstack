import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/database/prisma.service';
import { ConversationController } from './conversation.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatUploadController } from './chat-upload.controller';

@Module({
  imports: [JwtModule],
  controllers: [ConversationController, ChatUploadController],
  providers: [ChatGateway, ChatService, PrismaService],
})
export class ChatModule {}
