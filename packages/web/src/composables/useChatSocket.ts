import { ref } from 'vue';
import { io as ioClient, Socket } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Single shared socket across the app
const socketRef = ref<Socket | null>(null);
// Track joined rooms so we can re-join after reconnects
const joinedRooms = new Set<string>();

export function useChatSocket() {
  function connect() {
    if (socketRef.value) return socketRef.value;

    socketRef.value = ioClient(backendUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    // Re-join rooms on reconnect
    socketRef.value.on('connect', () => {
      joinedRooms.forEach((room) => {
        const threadId = room.replace('thread:', '');
        socketRef.value?.emit('thread:join', { threadId });
      });
    });

    return socketRef.value;
  }

  function joinThread(threadId: string) {
    if (!socketRef.value) connect();
    socketRef.value?.emit('thread:join', { threadId });
    joinedRooms.add(`thread:${threadId}`);
  }

  function leaveThread(threadId: string) {
    socketRef.value?.emit('thread:leave', { threadId });
    joinedRooms.delete(`thread:${threadId}`);
  }

  function onMessage(handler: (payload: any) => void) {
    socketRef.value?.on('chat:message', handler);
    // disposer
    return () => socketRef.value?.off('chat:message', handler);
  }

  function disconnect() {
    socketRef.value?.disconnect();
    socketRef.value = null;
    joinedRooms.clear();
  }

  return { connect, joinThread, leaveThread, onMessage, disconnect, socket: socketRef };
}