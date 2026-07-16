"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mic,
  Paperclip,
  Smile,
  Image,
  File,
  MapPin,
  StopCircle,
  ShieldAlert,
  AlertTriangle,
  X,
} from "lucide-react";
import { QUICK_REPLIES } from "@/lib/chat/types";
import type { QuickReply } from "@/lib/chat/types";
import { contactDetector } from "@/lib/security/contact-detector";

const EMOJIS = ["😀", "😂", "❤️", "👍", "🎉", "🔥", "🙏", "😎", "🥺", "🚀"];

interface ChatInputProps {
  onSend: (text: string, type?: string, file?: { url: string; name: string; size: number }) => void;
  userRole?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ onSend, userRole = "passenger", placeholder = "Digite sua mensagem...", disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [blockWarning, setBlockWarning] = useState<{ visible: boolean; message: string }>({ visible: false, message: "" });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const filteredQuickReplies = QUICK_REPLIES.filter(q => q.roles.includes(userRole));

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => { autoResize(); }, [text, autoResize]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const detection = contactDetector.check(trimmed, "current-user");
    if (detection.blocked) {
      setBlockWarning({ visible: true, message: detection.warning || "Mensagem bloqueada pelo sistema de segurança" });
      setTimeout(() => setBlockWarning({ visible: false, message: "" }), 5000);
      return;
    }

    onSend(trimmed);
    setText("");
    setShowEmojis(false);
    setShowAttach(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (qr: QuickReply) => {
    onSend(qr.text);
  };

  const handleEmojiClick = (emoji: string) => {
    setText(prev => prev + emoji);
    setShowEmojis(false);
    textareaRef.current?.focus();
  };

  const handleImageSelect = () => {
    imageInputRef.current?.click();
    setShowAttach(false);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
    setShowAttach(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onSend(`[Imagem: ${file.name}]`, "image", { url, name: file.name, size: file.size });
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onSend(`[Arquivo: ${file.name}]`, "file", { url, name: file.name, size: file.size });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLocationShare = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
          onSend(`📍 ${loc}`, "location", { url: loc, name: "Localização", size: 0 });
        },
        () => alert("Não foi possível obter sua localização.")
      );
    }
    setShowAttach(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      const dur = recordingDuration;
      setRecordingDuration(0);
      onSend(`🎤 Mensagem de voz (${dur}s)`, "audio", { url: "voice_mock", name: "Voz", size: dur });
    } else {
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  return (
    <div className="border-t border-card-border bg-background px-4 py-3">
      <AnimatePresence>
        {blockWarning.visible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 p-2.5 mb-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Mensagem bloqueada</p>
                <p>{blockWarning.message}</p>
              </div>
              <button onClick={() => setBlockWarning({ visible: false, message: "" })} className="shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {filteredQuickReplies.length > 0 && !text && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
          >
            {filteredQuickReplies.map(qr => (
              <button
                key={qr.id}
                onClick={() => handleQuickReply(qr)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card-bg border border-card-border text-sm text-gray-300 hover:border-primary/50 hover:text-primary transition-colors whitespace-nowrap"
              >
                {qr.icon && <span>{qr.icon}</span>}
                {qr.text}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        <div className="relative">
          <button
            onClick={() => { setShowAttach(prev => !prev); setShowEmojis(false); }}
            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-card-bg transition-colors"
            disabled={disabled}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showAttach && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-full left-0 mb-2 flex gap-2 bg-card-bg border border-card-border rounded-xl p-2 shadow-xl"
              >
                <button onClick={handleImageSelect} className="p-2 rounded-lg hover:bg-background text-gray-300 hover:text-primary transition-colors" title="Imagem">
                  <Image className="w-4 h-4" />
                </button>
                <button onClick={handleFileSelect} className="p-2 rounded-lg hover:bg-background text-gray-300 hover:text-primary transition-colors" title="Arquivo">
                  <File className="w-4 h-4" />
                </button>
                <button onClick={handleLocationShare} className="p-2 rounded-lg hover:bg-background text-gray-300 hover:text-primary transition-colors" title="Localização">
                  <MapPin className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Gravando..." : placeholder}
            disabled={disabled || isRecording}
            rows={1}
            className="w-full resize-none bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors max-h-[120px] scrollbar-none"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowEmojis(prev => !prev); setShowAttach(false); }}
            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-card-bg transition-colors"
            disabled={disabled || isRecording}
          >
            <Smile className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showEmojis && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-full right-0 mb-2 bg-card-bg border border-card-border rounded-xl p-2 shadow-xl flex gap-1"
              >
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="p-1 hover:bg-background rounded-lg transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={toggleRecording}
            className={`p-2 rounded-lg transition-colors ${
              isRecording
                ? "text-red-500 bg-red-500/10 animate-pulse"
                : "text-gray-400 hover:text-primary hover:bg-card-bg"
            }`}
            disabled={disabled}
          >
            {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {isRecording && (
            <span className="text-xs text-red-500 font-mono tabular-nums w-12">
              {recordingDuration}s
            </span>
          )}

          <button
            onClick={handleSend}
            disabled={!text.trim() || disabled || isRecording}
            className="p-2.5 rounded-xl bg-primary text-background hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
    </div>
  );
}
