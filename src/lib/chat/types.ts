export interface ChatMessage {
  id: string;
  tripId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: "passenger" | "driver" | "support" | "system" | "company";
  content: string;
  type: "text" | "image" | "audio" | "file" | "location" | "system";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  location?: { lat: number; lng: number; address?: string };
  duration?: number;
  replyTo?: string;
  readBy: string[];
  deliveredTo: string[];
  createdAt: string;
  updatedAt: string;
  encrypted: boolean;
}

export interface ChatConversation {
  id: string;
  tripId?: string;
  participants: { id: string; name: string; avatar?: string; role: string }[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isGroup: boolean;
  name?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "archived" | "blocked";
}

export interface QuickReply {
  id: string;
  text: string;
  icon?: string;
  roles: string[];
}

export const QUICK_REPLIES: QuickReply[] = [
  { id: "on_my_way", text: "Estou a caminho", icon: "🚗", roles: ["driver"] },
  { id: "arriving_5min", text: "Chego em 5 minutos", icon: "⏱️", roles: ["driver"] },
  { id: "im_here", text: "Já cheguei", icon: "📍", roles: ["driver"] },
  { id: "waiting", text: "Estou esperando", icon: "⏳", roles: ["passenger"] },
  { id: "where_are_you", text: "Onde você está?", icon: "❓", roles: ["passenger"] },
  { id: "thank_you", text: "Obrigado!", icon: "🙏", roles: ["passenger", "driver"] },
  { id: "safe_trip", text: "Boa viagem!", icon: "🍀", roles: ["passenger"] },
  { id: "on_time", text: "Ok, no horário", icon: "👍", roles: ["driver", "passenger"] },
];
