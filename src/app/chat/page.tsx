"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Search,
  ArrowLeft,
  CheckCheck,
  Check,
  MoreVertical,
  Phone,
  Video,
  User,
  Users,
  ChevronLeft,
  Clock,
} from "lucide-react";
import type { ChatConversation, ChatMessage } from "@/lib/chat/types";
import { ChatService } from "@/lib/chat/chat-service";
import { ChatInput } from "@/lib/components/chat-input";
import { ChatMessage as ChatMessageBubble } from "@/lib/components/chat-message";
import { useI18n } from "./layout";

type FilterMode = "all" | "trips" | "support";

function timeAgo(dateStr: string, t: (key: string) => string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("chat.just_now");
    if (mins < 60) return `${mins}${t("chat.minutes_ago")}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}${t("chat.hours_ago")}`;
    return `${Math.floor(hours / 24)}${t("chat.days_ago")}`;
  } catch {
    return "";
  }
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function StatusIndicator({ status }: { status: "online" | "offline" | "busy" }) {
  const colors = {
    online: "bg-green-500",
    offline: "bg-gray-500",
    busy: "bg-yellow-500",
  };
  return (
    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${colors[status]}`} />
  );
}

function getOtherParticipant(conversation: ChatConversation, currentUserId: string) {
  return conversation.participants.find(p => p.id !== currentUserId) || conversation.participants[0];
}

function getOnlineStatus(): "online" | "offline" | "busy" {
  return "online";
}

function shouldShowRole(conversation: ChatConversation, role: string): boolean {
  return conversation.participants.some(p => p.role === role);
}

export default function ChatPage() {
  const { t } = useI18n();
  const [currentUserId] = useState("user_current");
  const [userRole] = useState("passenger");
  const [service] = useState(() => new ChatService("user_current"));

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [showMobileList, setShowMobileList] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    service.getConversations(currentUserId).then(setConversations);
  }, [service, currentUserId]);

  useEffect(() => {
    if (!activeConversationId) return;
    service.getMessages(activeConversationId).then(msgs => {
      setMessages(msgs);
      scrollToBottom();
    });
    service.markAsRead(activeConversationId, currentUserId);
    setShowMobileList(false);
  }, [activeConversationId, service, currentUserId, scrollToBottom]);

  useEffect(() => {
    if (!activeConversationId) return;
    const unsub = service.subscribeToConversation(activeConversationId, msg => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(scrollToBottom, 100);
    });
    return unsub;
  }, [activeConversationId, service, scrollToBottom]);

  useEffect(() => {
    const unsub = service.subscribeToUser(currentUserId, conv => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === conv.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = conv;
          return next;
        }
        return [conv, ...prev];
      });
    });
    return unsub;
  }, [service, currentUserId]);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  const handleSend = useCallback(
    async (text: string, type?: string, file?: { url: string; name: string; size: number }) => {
      if (!activeConversationId) return;
      setIsTyping(true);
      await service.sendMessage(activeConversationId, text, type as ChatMessage["type"], file);
      setIsTyping(false);
    },
    [activeConversationId, service]
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      await service.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    },
    [service]
  );

  const handleReportMessage = useCallback(
    async (messageId: string) => {
      await service.reportMessage(messageId, "Denunciado pelo usuário");
    },
    [service]
  );

  const handleBackToList = () => {
    setActiveConversationId(null);
    setShowMobileList(true);
  };

  const filteredConversations = conversations.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      const match = c.participants.some(p => p.name.toLowerCase().includes(q)) ||
        c.name?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filter === "trips" && !c.tripId) return false;
    if (filter === "support" && !shouldShowRole(c, "support")) return false;
    return c.status !== "blocked";
  });

  const sortedConversations = [...filteredConversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* SIDEBAR */}
      <AnimatePresence mode="wait">
        {(showMobileList || !activeConversationId) && (
          <motion.div
            key="sidebar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full md:w-[380px] md:min-w-[380px] flex flex-col border-r border-card-border bg-background md:flex"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
              <h1 className="text-lg font-bold">{t("chat.title")}</h1>
              <button className="p-2 rounded-lg hover:bg-card-bg text-gray-400 hover:text-primary transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t("chat.search")}
                  className="w-full bg-card-bg border border-card-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 px-4 pb-3">
              {(["all", "trips", "support"] as FilterMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filter === mode
                      ? "bg-primary text-background"
                      : "bg-card-bg text-gray-400 hover:text-gray-200 border border-card-border"
                  }`}
                >
                  {mode === "all" ? t("chat.all") : mode === "trips" ? t("chat.trips") : t("chat.support")}
                </button>
              ))}
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto scrollbar-none">
              {sortedConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-card-bg flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400 font-medium">{t("chat.empty")}</p>
                  <p className="text-gray-600 text-sm mt-1">{t("chat.empty.sub")}</p>
                </div>
              ) : (
                sortedConversations.map(conv => {
                  const other = getOtherParticipant(conv, currentUserId);
                  const isActive = conv.id === activeConversationId;
                  return (
                    <motion.button
                      key={conv.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-card-bg/50 ${
                        isActive ? "bg-card-bg" : ""
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        {other.avatar ? (
                          <img src={other.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                            {other.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <StatusIndicator status={getOnlineStatus()} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm truncate">{other.name}</span>
                          {conv.lastMessage && (
                            <span className="text-[10px] text-gray-500 whitespace-nowrap tabular-nums">
                              {timeAgo(conv.lastMessage.createdAt, t)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs text-gray-500 truncate flex-1">
                            {conv.lastMessage ? truncate(conv.lastMessage.content, 60) : "Nenhuma mensagem ainda"}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="flex-shrink-0 bg-primary text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                            </span>
                          )}
                        </div>

                        {conv.lastMessage && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {conv.lastMessage.senderId === currentUserId && (
                              conv.lastMessage.readBy.length > 1
                                ? <CheckCheck className="w-3 h-3 text-blue-400" />
                                : <Check className="w-3 h-3 text-gray-500" />
                            )}
                            <span className="text-[10px] text-gray-600">
                              {conv.lastMessage.type !== "text" ? conv.lastMessage.type : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHAT PANEL */}
      <AnimatePresence mode="wait">
        {activeConversation && activeConversationId ? (
          <motion.div
            key={`chat-${activeConversationId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col min-w-0"
          >
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-card-border bg-background/80 backdrop-blur-sm">
              <button
                onClick={handleBackToList}
                className="md:hidden p-1 -ml-1 rounded-lg hover:bg-card-bg text-gray-400 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="relative flex-shrink-0">
                {(() => {
                  const other = getOtherParticipant(activeConversation, currentUserId);
                  return other.avatar ? (
                    <img src={other.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {other.name.charAt(0).toUpperCase()}
                    </div>
                  );
                })()}
                <StatusIndicator status={getOnlineStatus()} />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm truncate">
                  {getOtherParticipant(activeConversation, currentUserId).name}
                </h2>
                <p className="text-xs text-gray-500">
                  {activeConversation.tripId ? `Viagem #${activeConversation.tripId.slice(0, 8)}` : t("chat.online")}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-card-bg text-gray-400 hover:text-primary transition-colors">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-card-bg text-gray-400 hover:text-primary transition-colors">
                  <Video className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-card-bg text-gray-400 hover:text-primary transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messageListRef}
              className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-card-border scrollbar-track-transparent"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-card-bg flex items-center justify-center mb-3">
                    <MessageCircle className="w-6 h-6 text-gray-500" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">
                    {getOtherParticipant(activeConversation, currentUserId).name}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">Nenhuma mensagem ainda. Envie um "Olá!"</p>
                </div>
              ) : (
                <>
                  {messages.map(msg => (
                    <ChatMessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.senderId === currentUserId}
                      onDelete={handleDeleteMessage}
                      onReport={handleReportMessage}
                    />
                  ))}
                </>
              )}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-1"
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-gray-500">{t("chat.typing")}</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <ChatInput
              onSend={handleSend}
              userRole={userRole}
              placeholder={t("chat.input_placeholder")}
            />
          </motion.div>
        ) : (
          <motion.div
            key="no-chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hidden md:flex flex-1 flex-col items-center justify-center text-center px-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t("chat.select")}</h2>
            <p className="text-gray-500 text-sm max-w-xs">{t("chat.select.sub")}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
