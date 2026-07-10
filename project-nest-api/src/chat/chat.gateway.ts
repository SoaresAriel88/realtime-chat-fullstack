import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { SendMessagePayload } from './types/send-message-payload.type';
import { ChatService } from './chat.service';
import { PrismaService } from 'src/database/prisma.service';

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

type JwtPayload = {
  sub: string;
  email: string;
  tenantId: string;
};

type AuthenticatedSocketUser = {
  id: string;
  name: string;
  email: string;
  tenantId: string;
};

type OnlineUser = {
  id: string;
  name: string;
  status: 'online';
};

type OnlineUserWithSockets = OnlineUser & {
  socketIds: Set<string>;
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

  private readonly onlineUsersByRoom = new Map<
    string,
    Map<string, OnlineUserWithSockets>
  >();

  private readonly roomsBySocket = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const token = this.extractTokenFromSocket(client);

    if (!token) {
      console.log('Socket sem token. Desconectando:', client.id);
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET!,
      });

      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!user) {
        console.log('Usuário do token não encontrado. Socket:', client.id);
        client.disconnect(true);
        return;
      }

      client.data.user = {
        id: user.id,
        name: user.name,
        email: payload.email,
        tenantId: payload.tenantId,
      } satisfies AuthenticatedSocketUser;

      console.log(`Cliente conectado: ${client.id} - ${user.name}`);
    } catch (error) {
      console.log('Token inválido no socket:', error);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.removeSocketFromAllRooms(client);

    console.log('Cliente desconectado:', client.id);
  }

  @SubscribeMessage('chat:create_room')
  async handleCreateRoom(
    @MessageBody() data: { name?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<SocketAckResponse> {
    const currentUser = this.getAuthenticatedUser(client);

    if (!currentUser) {
      return {
        success: false,
        message: 'Usuário não autenticado',
      };
    }

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

    this.addOnlineUserToRoom(roomId, client);
    this.emitOnlineUsers(roomId);

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
    const currentUser = this.getAuthenticatedUser(client);

    if (!currentUser) {
      return {
        success: false,
        message: 'Usuário não autenticado',
      };
    }

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

    this.addOnlineUserToRoom(room.id, client);
    this.emitOnlineUsers(room.id);

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

    this.removeOnlineUserFromRoom(room.id, client);
    this.emitOnlineUsers(room.id);

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
    @ConnectedSocket() client: Socket,
  ): Promise<SocketAckResponse> {
    const currentUser = this.getAuthenticatedUser(client);

    if (!currentUser) {
      return {
        success: false,
        message: 'Usuário não autenticado',
      };
    }

    const room = data.room?.trim();
    const content = data.content?.trim();

    if (!room) {
      return {
        success: false,
        message: 'Sala não informada',
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
        authorId: currentUser.id,
        content,
      });

      const roomId: string = savedMessage.conversationId;

      const payload = {
        id: savedMessage.id,
        room: roomId,
        conversationId: roomId,
        authorId: savedMessage.authorId,
        author: {
          id: savedMessage.author.id,
          name: savedMessage.author.name,
          status: 'online',
        },
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
      };

      console.log('Mensagem salva no banco:', savedMessage.id);
      console.log('Emitindo para room:', roomId);

      this.server.to(roomId).emit('chat:new_message', payload);

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
    const currentUser = this.getAuthenticatedUser(client);
    const room = data.room?.trim();

    if (!currentUser) {
      return {
        success: false,
        message: 'Usuário não autenticado',
      };
    }

    if (!room) {
      return {
        success: false,
        message: 'Sala não informada',
      };
    }

    const payload: SocketTypingStart = {
      room,
      author: currentUser.name,
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
    const currentUser = this.getAuthenticatedUser(client);
    const room = data.room?.trim();

    if (!currentUser) {
      return {
        success: false,
        message: 'Usuário não autenticado',
      };
    }

    if (!room) {
      return {
        success: false,
        message: 'Sala não informada',
      };
    }

    const payload: SocketTypingStart = {
      room,
      author: currentUser.name,
    };

    client.to(payload.room).emit('chat:user_stop_typing', payload);

    return {
      success: true,
      message: 'Typing Stop enviado',
    };
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken;
    }

    const authorization = client.handshake.headers.authorization;

    if (typeof authorization === 'string') {
      const [type, token] = authorization.split(' ');

      if (type === 'Bearer' && token) {
        return token;
      }
    }

    return null;
  }

  private getAuthenticatedUser(client: Socket): AuthenticatedSocketUser | null {
    const user = client.data.user as AuthenticatedSocketUser | undefined;

    if (!user) {
      return null;
    }

    return user;
  }

  private addOnlineUserToRoom(roomId: string, client: Socket) {
    const user = this.getAuthenticatedUser(client);

    if (!user) return;

    let usersInRoom = this.onlineUsersByRoom.get(roomId);

    if (!usersInRoom) {
      usersInRoom = new Map<string, OnlineUserWithSockets>();
      this.onlineUsersByRoom.set(roomId, usersInRoom);
    }

    let onlineUser = usersInRoom.get(user.id);

    if (!onlineUser) {
      onlineUser = {
        id: user.id,
        name: user.name,
        status: 'online',
        socketIds: new Set<string>(),
      };

      usersInRoom.set(user.id, onlineUser);
    }

    onlineUser.socketIds.add(client.id);

    let roomsFromSocket = this.roomsBySocket.get(client.id);

    if (!roomsFromSocket) {
      roomsFromSocket = new Set<string>();
      this.roomsBySocket.set(client.id, roomsFromSocket);
    }

    roomsFromSocket.add(roomId);
  }

  private removeOnlineUserFromRoom(roomId: string, client: Socket) {
    const user = this.getAuthenticatedUser(client);

    if (!user) return;

    const usersInRoom = this.onlineUsersByRoom.get(roomId);

    if (!usersInRoom) return;

    const onlineUser = usersInRoom.get(user.id);

    if (!onlineUser) return;

    onlineUser.socketIds.delete(client.id);

    if (onlineUser.socketIds.size === 0) {
      usersInRoom.delete(user.id);
    }

    if (usersInRoom.size === 0) {
      this.onlineUsersByRoom.delete(roomId);
    }

    const roomsFromSocket = this.roomsBySocket.get(client.id);

    if (roomsFromSocket) {
      roomsFromSocket.delete(roomId);

      if (roomsFromSocket.size === 0) {
        this.roomsBySocket.delete(client.id);
      }
    }
  }

  private removeSocketFromAllRooms(client: Socket) {
    const roomsFromSocket = this.roomsBySocket.get(client.id);

    if (!roomsFromSocket) return;

    const roomIds = Array.from(roomsFromSocket);

    for (const roomId of roomIds) {
      this.removeOnlineUserFromRoom(roomId, client);
      this.emitOnlineUsers(roomId);
    }

    this.roomsBySocket.delete(client.id);
  }

  private emitOnlineUsers(roomId: string) {
    const usersInRoom = this.onlineUsersByRoom.get(roomId);

    const users: OnlineUser[] = usersInRoom
      ? Array.from(usersInRoom.values()).map((user) => ({
          id: user.id,
          name: user.name,
          status: user.status,
        }))
      : [];

    this.server.to(roomId).emit('chat:online_users', {
      room: roomId,
      users,
    });
  }
}
