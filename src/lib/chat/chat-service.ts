import type { ChatMessage, ChatConversation } from "./types";
import { contactDetector } from "@/lib/security/contact-detector";

type MessageCallback = (message: ChatMessage) => void;
type ConversationCallback = (conversation: ChatConversation) => void;
type DetectionCallback = (result: {
  blocked: boolean;
  warning: string;
  violationCount: number;
}) => void;

const STORAGE_PREFIX = "txd_chat_";
const MOCK_DELAY = 400;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch { /* quota exceeded */ }
}

let messageListeners: Map<string, Set<MessageCallback>> = new Map();
let userListeners: Map<string, Set<ConversationCallback>> = new Map();
let detectionListeners: Map<string, Set<DetectionCallback>> = new Map();
let pollTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

function notifyMessage(conversationId: string, message: ChatMessage) {
  const cbs = messageListeners.get(conversationId);
  if (cbs) cbs.forEach(cb => cb(message));
}

function notifyUser(userId: string, conversation: ChatConversation) {
  const cbs = userListeners.get(userId);
  if (cbs) cbs.forEach(cb => cb(conversation));
}

function startPolling(conversationId: string) {
  if (pollTimers.has(conversationId)) return;
  const interval = setInterval(() => {
    const messages = loadFromStorage<ChatMessage[]>(`msgs_${conversationId}`, []);
    const last = messages[messages.length - 1];
    if (last) notifyMessage(conversationId, last);
  }, 3000);
  pollTimers.set(conversationId, interval);
}

function stopPolling(conversationId: string) {
  const timer = pollTimers.get(conversationId);
  if (timer) {
    clearInterval(timer);
    pollTimers.delete(conversationId);
  }
}

export class ChatService {
  private currentUserId: string;

  constructor(userId: string) {
    this.currentUserId = userId;
  }

  setUserId(userId: string) {
    this.currentUserId = userId;
  }

  async sendMessage(
    conversationId: string,
    content: string,
    type: ChatMessage["type"] = "text",
    file?: { url: string; name: string; size: number }
  ): Promise<ChatMessage | null> {
    console.log(`[ChatService] sendMessage: conversation=${conversationId} type=${type}`);
    await delay(MOCK_DELAY);

    if (type === "text" && content.trim()) {
      const detection = contactDetector.check(content, this.currentUserId);
      if (detection.blocked) {
        const systemMsg: ChatMessage = {
          id: generateId(),
          senderId: "system",
          senderName: "Sistema",
          senderRole: "system",
          content: detection.warning || "Mensagem bloqueada pelo sistema de segurança",
          type: "system",
          readBy: [],
          deliveredTo: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          encrypted: false,
        };
        const messages = loadFromStorage<ChatMessage[]>(`msgs_${conversationId}`, []);
        messages.push(systemMsg);
        saveToStorage(`msgs_${conversationId}`, messages);
        notifyMessage(conversationId, systemMsg);

        this.notifyDetection(this.currentUserId, {
          blocked: true,
          warning: detection.warning || "Mensagem bloqueada pelo sistema de segurança",
          violationCount: contactDetector.getViolationCount(this.currentUserId),
        });

        return null;
      }
    }

    const messages = loadFromStorage<ChatMessage[]>(`msgs_${conversationId}`, []);
    const conversations = loadFromStorage<ChatConversation[]>("conversations", []);

    const message: ChatMessage = {
      id: generateId(),
      senderId: this.currentUserId,
      senderName: "Você",
      senderRole: "passenger",
      content,
      type,
      fileUrl: file?.url,
      fileName: file?.name,
      fileSize: file?.size,
      readBy: [this.currentUserId],
      deliveredTo: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      encrypted: false,
    };

    messages.push(message);
    saveToStorage(`msgs_${conversationId}`, messages);

    const convIndex = conversations.findIndex(c => c.id === conversationId);
    if (convIndex >= 0) {
      conversations[convIndex].lastMessage = message;
      conversations[convIndex].updatedAt = message.createdAt;
      saveToStorage("conversations", conversations);
    }

    notifyMessage(conversationId, message);
    return message;
  }

  async getConversations(userId: string): Promise<ChatConversation[]> {
    console.log(`[ChatService] getConversations: userId=${userId}`);
    await delay(MOCK_DELAY);
    return loadFromStorage<ChatConversation[]>("conversations", []);
  }

  async getMessages(
    conversationId: string,
    limit = 50,
    before?: string
  ): Promise<ChatMessage[]> {
    console.log(`[ChatService] getMessages: conversation=${conversationId} limit=${limit}`);
    await delay(MOCK_DELAY);

    const messages = loadFromStorage<ChatMessage[]>(`msgs_${conversationId}`, []);
    if (before) {
      const idx = messages.findIndex(m => m.id === before);
      return idx >= 0 ? messages.slice(Math.max(0, idx - limit), idx) : [];
    }
    return messages.slice(-limit);
  }

  async createConversation(
    participants: { id: string; name: string; avatar?: string; role: string }[],
    tripId?: string,
    isGroup = false
  ): Promise<ChatConversation> {
    console.log(`[ChatService] createConversation: participants=${participants.length}`);
    await delay(MOCK_DELAY);

    const conversations = loadFromStorage<ChatConversation[]>("conversations", []);

    const conversation: ChatConversation = {
      id: generateId(),
      tripId,
      participants,
      unreadCount: 0,
      isGroup,
      name: isGroup ? participants.map(p => p.name).join(", ") : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
    };

    conversations.push(conversation);
    saveToStorage("conversations", conversations);

    return conversation;
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    console.log(`[ChatService] markAsRead: conversation=${conversationId} userId=${userId}`);
    await delay(100);

    const conversations = loadFromStorage<ChatConversation[]>("conversations", []);
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.unreadCount = 0;
      saveToStorage("conversations", conversations);
    }

    const messages = loadFromStorage<ChatMessage[]>(`msgs_${conversationId}`, []);
    let changed = false;
    for (const msg of messages) {
      if (!msg.readBy.includes(userId)) {
        msg.readBy.push(userId);
        changed = true;
      }
    }
    if (changed) saveToStorage(`msgs_${conversationId}`, messages);
  }

  async deleteMessage(messageId: string): Promise<void> {
    console.log(`[ChatService] deleteMessage: messageId=${messageId}`);
    await delay(MOCK_DELAY);

    const allKeys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX + "msgs_"));
    for (const key of allKeys) {
      const messages = loadFromStorage<ChatMessage[]>(key.replace(STORAGE_PREFIX, ""), []);
      const idx = messages.findIndex(m => m.id === messageId);
      if (idx >= 0) {
        messages.splice(idx, 1);
        saveToStorage(key.replace(STORAGE_PREFIX, ""), messages);
        break;
      }
    }
  }

  async blockConversation(conversationId: string): Promise<void> {
    console.log(`[ChatService] blockConversation: ${conversationId}`);
    await delay(MOCK_DELAY);

    const conversations = loadFromStorage<ChatConversation[]>("conversations", []);
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.status = "blocked";
      saveToStorage("conversations", conversations);
    }
  }

  async reportMessage(messageId: string, reason: string): Promise<void> {
    console.log(`[ChatService] reportMessage: messageId=${messageId} reason=${reason}`);
    await delay(MOCK_DELAY);

    const reports = loadFromStorage<{ id: string; reason: string; date: string }[]>("reports", []);
    reports.push({ id: messageId, reason, date: new Date().toISOString() });
    saveToStorage("reports", reports);
  }

  subscribeToConversation(
    conversationId: string,
    callback: MessageCallback
  ): () => void {
    console.log(`[ChatService] subscribeToConversation: ${conversationId}`);

    if (!messageListeners.has(conversationId)) {
      messageListeners.set(conversationId, new Set());
    }
    messageListeners.get(conversationId)!.add(callback);
    startPolling(conversationId);

    return () => {
      const cbs = messageListeners.get(conversationId);
      if (cbs) {
        cbs.delete(callback);
        if (cbs.size === 0) {
          messageListeners.delete(conversationId);
          stopPolling(conversationId);
        }
      }
    };
  }

  subscribeToUser(
    userId: string,
    callback: ConversationCallback
  ): () => void {
    console.log(`[ChatService] subscribeToUser: ${userId}`);

    if (!userListeners.has(userId)) {
      userListeners.set(userId, new Set());
    }
    userListeners.get(userId)!.add(callback);

    const interval = setInterval(() => {
      const conversations = loadFromStorage<ChatConversation[]>("conversations", []);
      const userConvs = conversations.filter(c =>
        c.participants.some(p => p.id === userId)
      );
      userConvs.forEach(c => notifyUser(userId, c));
    }, 3000);

    const timerKey = `user_${userId}`;
    const oldTimer = pollTimers.get(timerKey);
    if (oldTimer) clearInterval(oldTimer);
    pollTimers.set(timerKey, interval);

    return () => {
      const cbs = userListeners.get(userId);
      if (cbs) {
        cbs.delete(callback);
        if (cbs.size === 0) {
          userListeners.delete(userId);
          const t = pollTimers.get(timerKey);
          if (t) { clearInterval(t); pollTimers.delete(timerKey); }
        }
      }
    };
  }

  private notifyDetection(userId: string, result: { blocked: boolean; warning: string; violationCount: number }) {
    const cbs = detectionListeners.get(userId);
    if (cbs) cbs.forEach(cb => cb(result));
  }

  subscribeToDetection(userId: string, callback: DetectionCallback): () => void {
    if (!detectionListeners.has(userId)) {
      detectionListeners.set(userId, new Set());
    }
    detectionListeners.get(userId)!.add(callback);
    return () => {
      const cbs = detectionListeners.get(userId);
      if (cbs) {
        cbs.delete(callback);
        if (cbs.size === 0) detectionListeners.delete(userId);
      }
    };
  }

  getViolationCount(): number {
    return contactDetector.getViolationCount(this.currentUserId);
  }

  destroy() {
    for (const [, timer] of pollTimers) clearInterval(timer);
    pollTimers.clear();
    messageListeners.clear();
    userListeners.clear();
    detectionListeners.clear();
  }
}
