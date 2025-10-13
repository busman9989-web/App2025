//packages\api\srcchat.ws

import { Server as WebSocketServer } from 'ws';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface UserPayload {
  id: string;
  // ...any other JWT payload fields
}

export function setupChatWebSocket(server: any, jwtSecret: string) {
  const wss = new WebSocketServer({ server, path: '/ws/chat' });

  wss.on('connection', async (ws, req) => {
    // Parse token from query params
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    let user: UserPayload;
    try {
      user = jwt.verify(token as string, jwtSecret) as UserPayload;
    } catch (e) {
      ws.close();
      return;
    }
    (ws as any).user = user;
    ws.isAlive = true;

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'message') {
          // Validate sender and thread
          const participant = await prisma.chatThreadParticipant.findFirst({
            where: { threadId: msg.threadId, userId: user.id }
          });
          if (!participant) return;

          const chatMsg = await prisma.chatMessage.create({
            data: {
              threadId: msg.threadId,
              senderId: user.id,
              text: msg.text
            },
            include: {
              sender: { select: { id: true, displayNameEncrypted: true, profilePictureUrl: true } }
            }
          });

          // Broadcast to all participants (including sender for echo)
          wss.clients.forEach(client => {
            if (
              (client as any).user &&
              client.readyState === 1 // WebSocket.OPEN === 1
            ) {
              client.send(JSON.stringify({
                type: 'message',
                message: {
                  id: chatMsg.id,
                  threadId: chatMsg.threadId,
                  user: {
                    id: chatMsg.sender.id,
                    displayName: chatMsg.sender.displayNameEncrypted,
                    avatarUrl: chatMsg.sender.profilePictureUrl
                  },
                  text: chatMsg.text,
                  timestamp: chatMsg.createdAt
                }
              }));
            }
          });
        }
      } catch (err) {
        // ignore malformed
      }
    });

    ws.on('close', () => { ws.isAlive = false; });
    ws.on('error', () => { ws.terminate(); });
  });

  // Heartbeat for cleaning up dead connections
  setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
}