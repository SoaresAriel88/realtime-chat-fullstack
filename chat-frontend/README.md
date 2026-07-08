# Realtime Chat Frontend

Frontend inicial para o chat realtime do projeto, feito em React + TypeScript + Vite e preparado para conversar com o backend NestJS + Socket.IO + Prisma.

## Visual

O layout foi inspirado em um padrão dashboard/chat parecido com shadcn:

- Sidebar com lista de conversations
- Área principal com histórico de mensagens
- Input de envio
- Painel lateral com participantes e status da conversation
- Indicador de conexão Socket.IO
- Indicador de typing
- Fallback visual com dados mockados quando o backend não está rodando

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev
```

Acesse:

```bash
http://localhost:5173
```

## Variáveis de ambiente

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_USER_ID=0ac5e452-59f4-485d-b2d6-fad991fbfc8f
VITE_USER_NAME=Ariel
```

## Integração esperada com o backend

### HTTP

O arquivo `src/services/chatApi.ts` espera estes endpoints:

```txt
GET  /conversations
GET  /conversations/:conversationId/messages
POST /conversations
```

Caso seu backend esteja usando outro caminho, ajuste apenas esse arquivo.

### Socket.IO

O arquivo `src/hooks/useChat.ts` usa estes eventos:

```txt
chat:join_room
chat:send_message
chat:new_message
chat:typing_start
chat:typing_stop
chat:user_typing
chat:user_stop_typing
```

O payload de envio de mensagem está preparado assim:

```ts
{
  conversationId: activeConversation.id,
  room: activeConversation.id,
  authorId: currentUser.id,
  content: content.trim()
}
```

Se o gateway estiver esperando `roomName` ou outro campo, ajuste no `useChat.ts`.

## Estrutura

```txt
src/
  components/
    Avatar.tsx
    ChatHeader.tsx
    ChatPage.tsx
    ConversationDetails.tsx
    ConversationSidebar.tsx
    MessageBubble.tsx
    MessageInput.tsx
    MessageList.tsx

  hooks/
    useChat.ts

  lib/
    currentUser.ts

  services/
    chatApi.ts
    mockData.ts
    socket.ts

  types/
    chat.ts
```

## Próximos passos

1. Conferir os nomes dos endpoints reais do backend.
2. Conferir se o gateway usa `conversationId`, `room` ou `roomName`.
3. Plugar autenticação JWT depois que o chat visual estiver funcionando.
4. Remover dados mockados quando a API estiver 100% integrada.
