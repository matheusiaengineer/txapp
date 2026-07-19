"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/browser";
import { notificationService } from "@/lib/notification/notification-service";

export interface TripMessage {
  id: string;
  senderId: string;
  senderRole: string;
  content: string;
  fileUrl?: string;
  fileType?: string;
  createdAt: string;
}

export function useTripChat(tripId: string | null, currentUserId: string | null) {
  const [messages, setMessages] = useState<TripMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const channelRef = useRef<any>(null);
  const presenceRef = useRef<any>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load messages + subscribe to new ones
  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    const supabase = createClient();

    supabase
      .from("trip_messages")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data.map(mapRow));
        setLoading(false);
      });

    const channel = supabase.channel(`trip-chat-${tripId}`);
    channelRef.current = channel;
    channel
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "trip_messages",
        filter: `trip_id=eq.${tripId}`,
      }, (payload: any) => {
        const msg = payload.new as any;
        if (msg.sender_id !== currentUserId) {
          sendPushNotification(msg);
        }
        setMessages(prev => [...prev, mapRow(msg)]);
      })
      .subscribe();

    // Typing presence
    const presence = supabase.channel(`trip-typing-${tripId}`);
    presenceRef.current = presence;
    presence
      .on("presence", { event: "sync" }, () => {
        const state = presence.presenceState();
        const typing: Record<string, string> = {};
        for (const [key, presences] of Object.entries(state)) {
          if (key !== currentUserId) {
            const p = (presences as any[])[0];
            typing[key] = p.name || "Alguém";
          }
        }
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            presence.track({
              user_id: user.id,
              name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Você",
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      presence.unsubscribe();
      presenceRef.current = null;
    };
  }, [tripId, currentUserId]);

  async function sendPushNotification(msg: any) {
    if (!tripId) return;
    try {
      const supabase = createClient();
      const { data: trip } = await supabase.from("trips").select("passenger_id, driver_id").eq("id", tripId).single();
      if (!trip) return;
      const recipientId = msg.sender_id === trip.passenger_id ? trip.driver_id : trip.passenger_id;
      if (!recipientId) return;
      const typeLabel = msg.file_type ? (msg.file_type === "image" ? "📷 Foto" : msg.file_type === "audio" ? "🎤 Áudio" : "📎 Arquivo") : "💬 Mensagem";
      await notificationService.create(recipientId, "message", typeLabel,
        msg.content || `Nova mensagem na corrida`, `/ride`);
    } catch {}
  }

  const send = useCallback(async (content: string): Promise<TripMessage | null> => {
    if (!tripId || !currentUserId || !content.trim()) return null;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.user_metadata?.role || "passenger";
    const { data, error } = await supabase
      .from("trip_messages")
      .insert({
        trip_id: tripId,
        sender_id: currentUserId,
        sender_role: role,
        content: content.trim(),
      })
      .select()
      .single();
    if (error) return null;
    setTypingUsers(prev => {
      const next = { ...prev };
      delete next[currentUserId!];
      return next;
    });
    return mapRow(data);
  }, [tripId, currentUserId]);

  const sendFile = useCallback(async (file: File): Promise<TripMessage | null> => {
    if (!tripId || !currentUserId) return null;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${tripId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const fileType = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "file";

    const { error: uploadError } = await supabase.storage
      .from("chat_files")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (uploadError) return null;

    const { data: { publicUrl } } = supabase.storage.from("chat_files").getPublicUrl(fileName);

    const role = user?.user_metadata?.role || "passenger";
    const { data, error } = await supabase
      .from("trip_messages")
      .insert({
        trip_id: tripId,
        sender_id: currentUserId,
        sender_role: role,
        content: fileType === "image" ? "📷 Foto" : fileType === "audio" ? "🎤 Áudio" : `📎 ${file.name}`,
        file_url: publicUrl,
        file_type: fileType,
      })
      .select()
      .single();
    if (error) return null;
    return mapRow(data);
  }, [tripId, currentUserId]);

  const emitTyping = useCallback(() => {
    if (!presenceRef.current) return;
    presenceRef.current.track({
      user_id: currentUserId,
      typing: true,
      typed_at: new Date().toISOString(),
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (presenceRef.current) {
        presenceRef.current.track({
          user_id: currentUserId,
          typing: false,
          typed_at: new Date().toISOString(),
        });
      }
    }, 2000);
  }, [currentUserId]);

  const isTyping = Object.keys(typingUsers).length > 0;
  const typingLabel = Object.values(typingUsers).join(" e ") + " está digitando...";

  return { messages, loading, send, sendFile, emitTyping, isTyping, typingLabel };
}

function mapRow(row: any): TripMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    content: row.content,
    fileUrl: row.file_url,
    fileType: row.file_type,
    createdAt: row.created_at,
  };
}
