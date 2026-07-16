"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  CheckCheck,
  Play,
  FileText,
  Download,
  MapPin,
  Trash2,
  Flag,
  X,
} from "lucide-react";
import type { ChatMessage } from "@/lib/chat/types";

interface ChatMessageProps {
  message: ChatMessage;
  isOwn: boolean;
  onDelete?: (id: string) => void;
  onReport?: (id: string) => void;
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageContent({ message }: { message: ChatMessage }) {
  switch (message.type) {
    case "image":
      return (
        <div className="group -mx-1 -mt-1 mb-1">
          {message.fileUrl ? (
            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={message.fileUrl}
                alt={message.fileName || "Imagem"}
                className="max-w-[240px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
              />
            </a>
          ) : (
            <div className="w-48 h-32 bg-card-bg rounded-xl flex items-center justify-center text-gray-500 text-sm">
              Imagem não disponível
            </div>
          )}
          {message.fileName && (
            <p className="text-xs text-gray-500 mt-1 truncate">{message.fileName}</p>
          )}
        </div>
      );

    case "audio":
      return (
        <div className="flex items-center gap-3 py-1 min-w-[180px]">
          <button className="p-2 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
            <Play className="w-4 h-4" />
          </button>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="w-0 h-full bg-primary rounded-full" />
          </div>
          <span className="text-xs text-gray-500 font-mono tabular-nums">
            {message.duration ? `${message.duration}s` : "0:00"}
          </span>
        </div>
      );

    case "file":
      return (
        <a
          href={message.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group -mx-1"
        >
          <FileText className="w-8 h-8 text-primary flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{message.fileName || "Arquivo"}</p>
            <p className="text-xs text-gray-500">{formatFileSize(message.fileSize)}</p>
          </div>
          <Download className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors flex-shrink-0" />
        </a>
      );

    case "location":
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-primary text-sm">
            <MapPin className="w-4 h-4" />
            <span>{message.location?.address || "Localização compartilhada"}</span>
          </div>
          {message.location && (
            <div className="w-48 h-24 rounded-lg bg-card-bg border border-card-border flex items-center justify-center overflow-hidden">
              <img
                src={`https://maps.geoapify.com/v1/staticmap?style=dark&width=400&height=200&center=lonlat:${message.location.lng},${message.location.lat}&zoom=15&apiKey=demo`}
                alt="Mapa"
                className="w-full h-full object-cover"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `
                    <div class="text-center text-gray-500 text-xs">
                      <div class="w-6 h-6 mx-auto mb-1">📍</div>
                      <div>${message.location!.lat.toFixed(4)}, ${message.location!.lng.toFixed(4)}</div>
                    </div>
                  `;
                }}
              />
            </div>
          )}
        </div>
      );

    case "system":
      return (
        <div className={`text-center text-xs ${message.content.includes("bloqueado") || message.content.includes("não é permitido") ? "text-red-400 bg-red-500/5 rounded-xl px-4 py-2 border border-red-500/20" : "text-gray-500 italic"}`}>
          <p>{message.content}</p>
        </div>
      );

    default:
      return (
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      );
  }
}

export function ChatMessage({ message, isOwn, onDelete, onReport }: ChatMessageProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");

  if (message.type === "system") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center py-2"
      >
        <MessageContent message={message} />
      </motion.div>
    );
  }

  const isSent = isOwn;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-2.5 px-4 py-1 ${isSent ? "flex-row-reverse" : ""}`}
    >
      {!isSent && (
        <div className="flex-shrink-0 mt-1">
          {message.senderAvatar ? (
            <img
              src={message.senderAvatar}
              alt={message.senderName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {message.senderName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[75%] min-w-0 ${isSent ? "items-end" : "items-start"} flex flex-col`}>
        {!isSent && (
          <span className="text-xs text-gray-500 mb-0.5 px-1">{message.senderName}</span>
        )}

        <div
          className={`relative group rounded-2xl px-3.5 py-2 ${
            isSent
              ? "bg-primary text-background rounded-br-md"
              : "bg-card-bg border border-card-border text-foreground rounded-bl-md"
          }`}
          onContextMenu={e => { e.preventDefault(); setShowMenu(prev => !prev); }}
        >
          <MessageContent message={message} />

          <div className={`flex items-center gap-1.5 mt-0.5 ${isSent ? "justify-end" : "justify-start"}`}>
            <span className={`text-[10px] ${isSent ? "text-background/60" : "text-gray-500"}`}>
              {formatTime(message.createdAt)}
            </span>
            {isSent && (
              <span className="flex">
                {message.readBy.length > 1 ? (
                  <CheckCheck className={`w-3 h-3 ${message.readBy.length > 1 ? "text-blue-400" : "text-background/60"}`} />
                ) : message.deliveredTo.length > 0 ? (
                  <Check className="text-background/60 w-3 h-3" />
                ) : null}
              </span>
            )}
          </div>

          <div className={`absolute top-0 ${isSent ? "left-0 pl-1" : "right-0 pr-1"} pt-1 hidden group-hover:flex gap-0.5`}>
            <button
              onClick={() => setShowMenu(prev => !prev)}
              className="p-1 rounded-lg bg-background/80 text-gray-400 hover:text-red-400 transition-colors text-xs"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute top-0 ${isSent ? "left-0" : "right-0"} -translate-y-full -mt-1 bg-card-bg border border-card-border rounded-xl p-1 shadow-xl z-10 flex gap-1`}
            >
              <button
                onClick={() => { onDelete?.(message.id); setShowMenu(false); }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                title="Excluir"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setShowMenu(false); setShowReport(true); }}
                className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-yellow-400 transition-colors"
                title="Denunciar"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </div>

        {showReport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-1 flex gap-2 items-center"
          >
            <input
              type="text"
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="Motivo da denúncia..."
              className="text-xs bg-card-bg rounded-lg px-2 py-1 border border-card-border text-foreground placeholder-gray-500 focus:outline-none focus:border-primary/50 w-40"
            />
            <button
              onClick={() => { onReport?.(message.id); setShowReport(false); setReportReason(""); }}
              disabled={!reportReason.trim()}
              className="text-xs px-2 py-1 rounded-lg bg-red-500/20 text-red-400 disabled:opacity-40"
            >
              Enviar
            </button>
            <button onClick={() => setShowReport(false)} className="text-gray-500">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
