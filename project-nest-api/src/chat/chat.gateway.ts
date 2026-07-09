import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { SendMessagePayload } from './types/send-message-payload.type';
import { ChatService } from './chat.service';

type SocketAckResponse = {
  success: boolean;
  message: string;
  room?: {
    id: string;
    name: string;
  };
};

type SocketTypingStart = {
  room: string;
  author: string;
};

@WebSocketGateway({
  transports: ['websocket'],
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log('Cliente conectado:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado:', client.id);
  }

  @SubscribeMessage('chat:create_room')
  async handleCreateRoom(
    @MessageBody() data: { name?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<SocketAckResponse> {
    const roomName = data.name?.trim();

    if (!roomName) {
      return {
        success: false,
        message: 'Nome da sala é obrigatório',
      };
    }

    const room = await this.chatService.roomCreate({
      name: roomName,
    });
    const roomId: string = room.id;
    await client.join(roomId);

    console.log(`Sala criada com sucesso: ${room.name}`);
    console.log(`Cliente ${client.id} entrou na sala ID: ${room.id}`);

    return {
      success: true,
      message: `Sala ${room.name} criada com sucesso`,
      room: {
        id: room.id,
        name: room.name,
      },
    };
  }

  @SubscribeMessage('chat:join_room')
  async handleJoinRoom(
    @MessageBody() data: { room?: string; name?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<SocketAckResponse> {
    const roomIdentifier = data.room?.trim() || data.name?.trim();

    if (!roomIdentifier) {
      return {
        success: false,
        message: 'Sala não informada',
      };
    }

    const room = await this.chatService.findRoomByIdOrName(roomIdentifier);

    if (!room) {
      return {
        success: false,
        message: 'Sala não encontrada',
      };
    }

    await client.join(room.id);

    console.log(`Cliente ${client.id} entrou na sala ${room.name}`);
    console.log(`Room ID usada no socket: ${room.id}`);

    return {
      success: true,
      message: `Entrou na sala ${room.name}`,
      room: {
        id: room.id,
        name: room.name,
      },
    };
  }

  @SubscribeMessage('chat:leave_room')
  async handleLeaveRoom(
    @MessageBody() data: { room?: string; name?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<SocketAckResponse> {
    const roomIdentifier = data.room?.trim() || data.name?.trim();

    if (!roomIdentifier) {
      return {
        success: false,
        message: 'Sala não informada',
      };
    }

    const room = await this.chatService.findRoomByIdOrName(roomIdentifier);

    if (!room) {
      return {
        success: false,
        message: 'Sala não encontrada',
      };
    }

    await client.leave(room.id);

    console.log(`Cliente ${client.id} saiu da sala ${room.name}`);
    console.log(`Room ID removida do socket: ${room.id}`);

    return {
      success: true,
      message: `Saiu da sala ${room.name}`,
      room: {
        id: room.id,
        name: room.name,
      },
    };
  }

  @SubscribeMessage('chat:send_message')
  async handleSendMessage(
    @MessageBody() data: SendMessagePayload,
  ): Promise<SocketAckResponse> {
    const room = data.room?.trim();
    const authorId = data.authorId?.trim();
    const content = data.content?.trim();

    if (!room) {
      return {
        success: false,
        message: 'Sala não informada',
      };
    }

    if (!authorId) {
      return {
        success: false,
        message: 'Autor não informado',
      };
    }

    if (!content) {
      return {
        success: false,
        message: 'Mensagem vazia',
      };
    }

    try {
      const savedMessage = await this.chatService.saveMessageByConversation({
        conversationId: room,
        authorId,
        content,
      });

      const roomId: string = savedMessage.conversationId;

      const payload = {
        id: savedMessage.id,
        room: roomId,
        conversationId: roomId,
        authorId: savedMessage.authorId,
        author: savedMessage.author.name,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
      };

      console.log('Mensagem salva no banco:', savedMessage.id);
      console.log('Emitindo para room:', roomId);

      void this.server.to(roomId).emit('chat:new_message', payload);

      return {
        success: true,
        message: 'Mensagem enviada',
      };
    } catch (error) {
      console.log('Erro ao salvar mensagem:', error);

      return {
        success: false,
        message: 'Erro ao salvar mensagem',
      };
    }
  }

  @SubscribeMessage('chat:typing_start')
  handleTypingStart(
    @MessageBody() data: SocketTypingStart,
    @ConnectedSocket() client: Socket,
  ): SocketAckResponse {
    const room = data.room?.trim();
    const author = data.author?.trim();

    if (!room) {
      return {
        success: false,
        message: 'Sala não informada',
      };
    }

    if (!author) {
      return {
        success: false,
        message: 'Autor não informado',
      };
    }

    const payload: SocketTypingStart = {
      room,
      author,
    };

    client.to(payload.room).emit('chat:user_typing', payload);

    return {
      success: true,
      message: 'Typing enviado',
    };
  }

  @SubscribeMessage('chat:typing_stop')
  handleTypingStop(
    @MessageBody() data: SocketTypingStart,
    @ConnectedSocket() client: Socket,
  ): SocketAckResponse {
    const room = data.room?.trim();
    const author = data.author?.trim();

    if (!room) {
      return {
        success: false,
        message: 'Sala não informada',
      };
    }

    if (!author) {
      return {
        success: false,
        message: 'Autor não informado',
      };
    }

    const payload: SocketTypingStart = {
      room,
      author,
    };

    client.to(payload.room).emit('chat:user_stop_typing', payload);

    return {
      success: true,
      message: 'Typing Stop enviado',
    };
  }
}
