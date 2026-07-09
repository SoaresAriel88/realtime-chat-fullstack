import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ConversationController } from './conversation.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [ConversationController],
  providers: [ChatGateway, ChatService],
  imports: [DatabaseModule],
})
export class ChatModule {}
