"use client";

import { useState, createContext, useContext, useCallback } from "react";
import type { Locale } from "@/lib/i18n/config";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "pt-BR",
  setLocale: () => {},
  t: (key: string) => key,
});

export function useI18n() {
  return useContext(I18nContext);
}

const translations: Record<string, Record<string, string>> = {
  "pt-BR": {
    "chat.title": "Mensagens",
    "chat.search": "Buscar conversas...",
    "chat.all": "Todas",
    "chat.trips": "Viagens",
    "chat.support": "Suporte",
    "chat.empty": "Nenhuma conversa ainda",
    "chat.empty.sub": "Suas conversas aparecerão aqui",
    "chat.select": "Selecione uma conversa",
    "chat.select.sub": "Escolha um chat ao lado para começar",
    "chat.typing": "Digitando...",
    "chat.new": "Nova conversa",
    "chat.online": "Online",
    "chat.offline": "Offline",
    "chat.just_now": "agora",
    "chat.minutes_ago": "min atrás",
    "chat.hours_ago": "h atrás",
    "chat.days_ago": "d atrás",
    "chat.input_placeholder": "Digite sua mensagem...",
  },
  "en-US": {
    "chat.title": "Messages",
    "chat.search": "Search conversations...",
    "chat.all": "All",
    "chat.trips": "Trips",
    "chat.support": "Support",
    "chat.empty": "No conversations yet",
    "chat.empty.sub": "Your conversations will appear here",
    "chat.select": "Select a conversation",
    "chat.select.sub": "Choose a chat to start messaging",
    "chat.typing": "Typing...",
    "chat.new": "New conversation",
    "chat.online": "Online",
    "chat.offline": "Offline",
    "chat.just_now": "just now",
    "chat.minutes_ago": "min ago",
    "chat.hours_ago": "h ago",
    "chat.days_ago": "d ago",
    "chat.input_placeholder": "Type a message...",
  },
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("pt-BR");

  const t = useCallback(
    (key: string) => translations[locale]?.[key] || translations["pt-BR"]?.[key] || key,
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
