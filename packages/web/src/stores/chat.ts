// web/src/stores/chat.ts
import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import api from '@/api';

interface ChatThread {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar: string | null;
  recipientStatus: string | null;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    displayName: string;
    profilePictureUrl?: string | null;
  };
}

interface UserSummary {
  id: string;
  displayName: string;
  email?: string;
  profilePictureUrl?: string | null;
}

interface ChatState {
  threads: ChatThread[];
  activeThreadId: string | null;
  activeMessages: ChatMessage[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMessages: boolean;
  ws: WebSocket | null;
  allUsers: UserSummary[];
}

// Helper: make avatar URLs absolute to the API origin when needed
const apiOrigin = import.meta.env.VITE_API_URL || 'http://localhost:3000';
function normalizeAvatar(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url; // already absolute
  if (url.startsWith('/')) return `${apiOrigin}${url}`;
  return `${apiOrigin}/${url}`;
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    threads: [],
    activeThreadId: null,
    activeMessages: [],
    unreadCount: 0,
    isLoading: false,
    isLoadingMessages: false,
    ws: null,
    allUsers: [],
  }),

  getters: {
    activeThread: (state) => state.threads.find((t) => t.id === state.activeThreadId) || null,
  },

  actions: {
    get authStore() {
      return useAuthStore();
    },

    async fetchThreads() {
      console.log('[CHAT STORE] Fetching threads...');
      this.isLoading = true;

      try {
        const { data } = await api.get('/api/chat/threads');
        console.log('[CHAT STORE] Threads fetched:', data);

        const meId = this.authStore.user?.id;

        this.threads = data.map((thread: any) => {
          const other =
            thread.participants?.find((p: any) => p.id !== meId) ||
            thread.participants?.[0] ||
            null;

          return {
            id: thread.id,
            recipientId: other?.id || '',
            recipientName: other?.displayName || other?.email || 'Unknown User',
            recipientAvatar: normalizeAvatar(other?.avatarUrl ?? other?.profilePictureUrl ?? null),
            recipientStatus: null,
            lastMessageAt: thread.lastMessage?.timestamp
              ? new Date(thread.lastMessage.timestamp).toISOString()
              : new Date().toISOString(),
            lastMessagePreview: thread.lastMessage?.text || null,
            unreadCount: 0,
          };
        });

        this.unreadCount = this.threads.reduce((sum, t) => sum + t.unreadCount, 0);
        console.log('[CHAT STORE] Processed threads:', this.threads.length);
      } catch (error) {
        console.error('[CHAT STORE] Failed to fetch threads:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMessages(threadId: string) {
      console.log('[CHAT STORE] Fetching messages for thread:', threadId);
      this.isLoadingMessages = true;

      try {
        const { data } = await api.get(`/api/chat/messages/${threadId}`);
        console.log('[CHAT STORE] Messages fetched:', data);

        this.activeMessages = data.map((msg: any) => ({
          id: msg.id,
          threadId: msg.threadId,
          senderId: msg.user?.id || '',
          content: msg.text,
          createdAt: msg.timestamp
            ? new Date(msg.timestamp).toISOString()
            : new Date().toISOString(),
          sender: {
            id: msg.user?.id || '',
            displayName: msg.user?.displayName || msg.user?.email || 'Unknown User',
            profilePictureUrl: normalizeAvatar(msg.user?.avatarUrl ?? msg.user?.profilePictureUrl ?? null),
          },
        }));

        console.log('[CHAT STORE] Processed messages:', this.activeMessages.length);
      } catch (error) {
        console.error('[CHAT STORE] Failed to fetch messages:', error);
        throw error;
      } finally {
        this.isLoadingMessages = false;
      }
    },

    async setActiveThread(threadId: string) {
      console.log('[CHAT STORE] Setting active thread:', threadId);
      this.activeThreadId = threadId;
      this.activeMessages = [];
      await this.fetchMessages(threadId);
    },

    async sendMessage(content: string) {
      if (!this.activeThreadId || !content.trim()) {
        throw new Error('No active thread or empty message');
      }
      console.log('[CHAT STORE] Sending message:', content);

      try {
        // POST only; do NOT push to activeMessages here.
        const { data } = await api.post(`/api/chat/messages/${this.activeThreadId}`, {
          text: content.trim(),
        });
        console.log('[CHAT STORE] Message sent:', data);

        // Update thread preview/time; the message itself will arrive via socket
        const thread = this.threads.find(t => t.id === this.activeThreadId);
        if (thread) {
          thread.lastMessagePreview = content.trim();
          thread.lastMessageAt = data.timestamp
            ? new Date(data.timestamp).toISOString()
            : new Date().toISOString();
        }

        return data;
      } catch (error) {
        console.error('[CHAT STORE] Failed to send message:', error);
        throw error;
      }
    },

    async createThread(recipientId: string): Promise<string> {
      console.log('[CHAT STORE] Creating thread with user:', recipientId);

      try {
        const { data } = await api.post('/api/chat/threads', { recipientId });
        console.log('[CHAT STORE] Thread created/found:', data);
        await this.fetchThreads();
        return data.id as string;
      } catch (error) {
        console.error('[CHAT STORE] Failed to create thread:', error);
        throw error;
      }
    },

    async loadAllUsers() {
      if (this.allUsers.length > 0) return;
      try {
        console.log('[CHAT STORE] Fetching all users...');
        const { data } = await api.get('/api/users');
        this.allUsers = Array.isArray(data)
          ? data.map((user: any) => ({
              id: user.id,
              displayName: user.displayName || user.email,
              email: user.email,
              profilePictureUrl: normalizeAvatar(user.profilePictureUrl || null),
            }))
          : [];
        console.log('[CHAT STORE] Cached users:', this.allUsers.length);
      } catch (err) {
        console.error('[CHAT STORE] Failed to load all users', err);
      }
    },

    async searchUsers(query: string): Promise<UserSummary[]> {
      if (!query || query.length < 2) return [];
      console.log('[CHAT STORE] Searching users:', query);
      const q = query.toLowerCase();
      if (this.allUsers.length === 0) await this.loadAllUsers();

      const results = this.allUsers.filter((u) => {
        const matchesName = u.displayName?.toLowerCase().includes(q);
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const isNotSelf = u.id !== this.authStore.user?.id;
        return (matchesName || matchesEmail) && isNotSelf;
      });

      console.log('[CHAT STORE] Found users:', results.length);
      return results;
    },

    // IMPORTANT: If you are using Socket.IO via useChatSocket(), avoid also using this raw WebSocket.
    // Leave it unused or remove it to prevent double-delivery of the same events.
    connectWebSocket() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('[CHAT STORE] WebSocket already connected');
        return;
      }

      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
        const wsHost = apiUrl ? apiUrl.replace(/^https?:\/\//, '') : 'localhost:3000';
        const wsUrl = `${wsProtocol}//${wsHost}/ws/chat`;

        console.log('[CHAT STORE] Connecting to WebSocket:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => console.log('[CHAT STORE] ✅ WebSocket connected');
        this.ws.onerror = (error) => console.error('[CHAT STORE] ❌ WebSocket error:', error);

        this.ws.onclose = () => {
          console.log('[CHAT STORE] 🔌 WebSocket disconnected');
          this.ws = null;
          setTimeout(() => {
            console.log('[CHAT STORE] 🔄 Attempting to reconnect...');
            this.connectWebSocket();
          }, 5000);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[CHAT STORE] 📨 WebSocket message:', data);

            if (data.type === 'message') {
              const m = data.message;
              const normalized: ChatMessage = {
                id: m.id,
                threadId: m.threadId,
                senderId: m.user.id,
                content: m.text,
                createdAt: m.timestamp
                  ? new Date(m.timestamp).toISOString()
                  : new Date().toISOString(),
                sender: {
                  id: m.user.id,
                  displayName: m.user.displayName || m.user.email || 'Unknown User',
                  profilePictureUrl: normalizeAvatar(m.user.avatarUrl ?? m.user.profilePictureUrl ?? null),
                },
              };

              if (normalized.threadId === this.activeThreadId) {
                const exists = this.activeMessages.find((x) => x.id === normalized.id);
                if (!exists) this.activeMessages.push(normalized);
              }

              const thread = this.threads.find((t) => t.id === normalized.threadId);
              if (thread) {
                thread.lastMessagePreview = normalized.content;
                thread.lastMessageAt = normalized.createdAt;
              }
            }
          } catch (error) {
            console.error('[CHAT STORE] Failed to parse WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('[CHAT STORE] Failed to initialize WebSocket:', error);
      }
    },

    disconnectWebSocket() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
        console.log('[CHAT STORE] WebSocket manually disconnected');
      }
    },
  },
});