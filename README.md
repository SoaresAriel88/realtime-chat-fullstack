# 💬 Realtime Chat Platform

Sistema de chat realtime multi-tenant, com apps web (React) e mobile (React Native/Expo), backend em NestJS com Socket.IO, Prisma e PostgreSQL.

Desenvolvido como projeto de estudo/prática de arquitetura backend, sistemas realtime e desenvolvimento fullstack — incluindo os bugs reais encontrados e corrigidos ao longo do desenvolvimento (documentados abaixo, não escondidos).

---

## 🚀 Tecnologias

**Backend**
- NestJS · TypeScript
- Socket.IO
- Prisma ORM + PostgreSQL
- Redis (OTP, tentativas, cooldown)
- JWT Authentication
- Multer (upload de arquivos)
- BullMQ (filas de email)

**Frontend Web**
- React + TypeScript + Vite
- Socket.IO Client

**Mobile**
- React Native (Expo)
- AsyncStorage
- Socket.IO Client
- expo-router

---

## 📌 Sobre o projeto

A aplicação permite:

- Cadastro, verificação de email e login com JWT
- Recuperação de senha via OTP (Redis)
- Multi-tenancy com isolamento total de dados entre organizações
- Criação de conversas, com sincronização em tempo real entre clientes (sem precisar de refresh)
- Envio de mensagens de texto
- Envio de anexos (imagem, áudio, arquivo) como mensagens próprias, persistidas e recuperáveis após reload
- Indicador de "digitando..."
- Lista de usuários online
- Logout completo (web e mobile), limpando sessão e desconectando o socket

### Sobre mensagens com mídia

Cada mensagem tem um `type` único (`TEXT | IMAGE | AUDIO | FILE`) — não existe uma mensagem que carregue texto e mídia ao mesmo tempo no banco. Quando o usuário manda texto seguido de uma imagem e um áudio, isso são **três mensagens separadas**, que a interface agrupa visualmente por proximidade de autor/horário. Vale saber disso antes de mexer no schema ou no agrupamento do frontend — são responsabilidades diferentes e já causaram bug de "mídia sumindo" quando ficaram dessincronizadas (ver abaixo).

---

## 🏗️ Arquitetura geral

```
             CLIENT (Web / Mobile)
               |
    HTTP      |      WebSocket
               |
    -----------------------
    |                     |
    ↓                     ↓
REST API            Socket Gateway
 (NestJS)             (Socket.IO)
    |                     |
    -----------------------
               |
               ↓
          Application
               |
               ↓
          Prisma ORM
               |
               ↓
         PostgreSQL  +  Redis
```

---

## 🔐 Autenticação

```
Cadastro → OTP por email → Verificação → Login → JWT → Acesso
```

Payload do token:

```json
{
  "sub": "userId",
  "tenantId": "tenantId",
  "email": "usuario@email.com"
}
```

O `tenantId` isola os dados entre organizações em todas as queries.

---

## 🏢 Multi-tenancy

Cada `Tenant` possui seus próprios usuários, conversas, mensagens e arquivos — sem cruzamento de dados entre organizações.

---

## 💬 Chat realtime

Eventos principais via Socket.IO:

| Evento | Direção | Descrição |
|---|---|---|
| `chat:create_room` | client → server | Cria conversa pelo socket |
| `chat:join_room` / `chat:leave_room` | client → server | Entra/sai da room da conversa |
| `chat:send_message` | client → server | Envia mensagem de texto |
| `chat:room_created` | server → client | Notifica todo o tenant que uma sala nova existe |
| `chat:typing_start` / `chat:typing_stop` | bidirecional | Indicador de digitação |
| `chat:online_users` | server → client | Lista de usuários online |

### Rooms

- Cada conversa tem sua própria room Socket.IO (`socket.join(conversationId)`).
- Todo cliente autenticado entra automaticamente em uma room de tenant (`tenant:{tenantId}`) na conexão — é esse canal que permite broadcasts como "sala criada" ou "sala apagada" para todos os membros da organização, sem depender de estarem numa conversa específica.

---

## 🗄️ Banco de dados (entidades principais)

**User** — id, name, email, password, tenantId, roleId
**Tenant** — id, name, slug
**Conversation** — id, tenantId, name, createdAt, updatedAt *(sem `ownerId` ainda — ver Roadmap)*
**Message** — id, conversationId, senderId, type, content, fileUrl, fileName, mimeType, fileSize, createdAt

---

## 📎 Upload de arquivos

```
Upload (REST, multipart) → Multer salva no disco → Message criada no banco
   → chatGateway.emitNewMessage() → clientes recebem em tempo real
```

O mesmo endpoint REST é responsável por persistir **e** notificar via socket — o cliente não precisa (e não deve) emitir um evento de socket adicional depois do upload; isso já foi uma causa de mensagem duplicada/potencial e foi removido do fluxo mobile.

---

## 📨 Histórico de mensagens

```
GET /conversations/:id/messages → Controller → Service → Prisma → PostgreSQL
```

O endpoint retorna, por mensagem: `id`, `type`, `content`, `fileUrl`, `fileName`, `mimeType`, `fileSize`, `audioDuration`, `createdAt`, `authorId`, `author`.

> **Bug corrigido:** esse endpoint chegou a retornar só texto e metadados de autor, descartando todos os campos de mídia no `.map()` de resposta. O resultado era mídia sumindo *só* depois de F5 — a mensagem existia completa no banco e chegava completa via socket, mas o histórico REST devolvia uma versão podada. Corrigido incluindo os campos de mídia no mapeamento de retorno.

---

## 🔄 Sincronização de salas em tempo real

> **Bug corrigido:** criar uma sala só era refletida em outros clientes após F5, porque a criação (REST ou via `chat:create_room`) nunca emitia nada pelo socket. Corrigido com:
> - Join automático na room `tenant:{tenantId}` no `handleConnection`
> - Emissão de `chat:room_created` para essa room nos dois pontos de criação (REST e socket)
> - Listener no frontend/mobile que adiciona a sala à lista local, com guard contra duplicação para quem criou a própria sala

---

## 📱 Versão mobile (React Native)

Implementada com o mesmo padrão de eventos e listeners do web, adaptando storage (`AsyncStorage` no lugar de `localStorage`) e navegação (`expo-router`). Inclui:

- Conexão/autenticação de socket via `connectSocket()` assíncrono
- Mesmos eventos de sala e mensagem do web
- Envio de anexos via REST (sem emit redundante de socket)
- Logout com limpeza de `AsyncStorage` e `router.replace('/login')`

---

## 🚪 Logout

Web e mobile: desconecta o socket, limpa o storage de sessão (`localStorage` / `AsyncStorage`), reseta o estado local (conversas, mensagens, usuários online) e redireciona para o login.

---

## 🔄 Recuperação de senha

```
Email → OTP gerado e salvo no Redis → Email enviado → Confirmação do código
   → Token temporário → Nova senha
```

Redis controla expiração do código, tentativas e cooldown.

---

## 📁 Estrutura do projeto

```
project
├── backend
│   ├── auth
│   ├── chat
│   ├── users
│   ├── tenant
│   ├── websocket
│   ├── prisma
│   └── redis
├── frontend (web)
│   ├── components
│   ├── hooks
│   ├── services
│   ├── pages
│   └── types
└── mobile (React Native / Expo)
    ├── hooks
    ├── lib
    ├── services
    └── components
```

---

## 🧠 Desafios reais resolvidos

- ✅ Autenticação via JWT em WebSocket
- ✅ Multi-tenancy com isolamento de dados
- ✅ Persistência de mensagens com mídia sobrevivendo a reload (bug corrigido)
- ✅ Sincronização de criação de sala em tempo real (bug corrigido)
- ✅ Versão mobile com paridade de eventos com o web
- ✅ Logout completo (web e mobile)
- ✅ Controle de OTP e recuperação de senha via Redis

---

## 🔮 Roadmap (não implementado ainda)

- **Apagar conversas** — decisão já tomada (apenas o criador pode apagar, cascade delete de mensagens e participantes), mas requer migration para adicionar `ownerId` em `Conversation` (com estratégia de backfill para conversas já existentes) e ainda não tem endpoint, gateway method nem listener no frontend.
- Definir se arquivos físicos de mensagens apagadas são removidos do disco ou ficam órfãos
- Paginação de mensagens / infinite scroll
- Status de mensagem (enviado / entregue / visualizado)
- Mensagens respondidas e reações
- Notificações push
- Testes automatizados
- Deploy com Docker/Kubernetes

---

## 👨‍💻 Desenvolvedor

Desenvolvido por Ariel Soares — projeto de estudo e prática de arquitetura backend, sistemas realtime e desenvolvimento fullstack.

## 📄 Licença

Projeto para fins educacionais e demonstração de conhecimento técnico.
