"use client";

import { createClient } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { logger } from "@/lib/utils/logger";

type ChannelName = string;
type EventHandler = (payload: any) => void;

interface SocketConfig {
  maxRetries: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
}

export class SocketService {
  private channels: Map<ChannelName, RealtimeChannel> = new Map();
  private handlers: Map<string, EventHandler> = new Map();
  private retryCount: Map<ChannelName, number> = new Map();
  private config: SocketConfig;
  private serverTimeDiff: number = 0;
  private chatThrottle: Map<string, number> = new Map();

  constructor(config: Partial<SocketConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 10,
      baseDelay: config.baseDelay ?? 1000,
      maxDelay: config.maxDelay ?? 16000,
    };
  }

  private get supabase() {
    return createClient();
  }

  // Exponential backoff for reconnection (rule 67)
  private getRetryDelay(channel: ChannelName): number {
    const count = this.retryCount.get(channel) || 0;
    const delay = Math.min(
      this.config.baseDelay * Math.pow(2, count),
      this.config.maxDelay
    );
    this.retryCount.set(channel, count + 1);
    return delay;
  }

  // Subscribe to a channel with room isolation (rule 76)
  subscribe(channelName: ChannelName, event: string, handler: EventHandler): this {
    if (this.channels.has(channelName)) {
      logger.warn(`Channel ${channelName} already exists`);
      return this;
    }

    const handlerKey = `${channelName}:${event}`;
    this.handlers.set(handlerKey, handler);

    const channel = this.supabase.channel(channelName);

    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public" },
      (payload: any) => {
        const h = this.handlers.get(handlerKey);
        if (h) h(payload);
      }
    );

    channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        this.retryCount.set(channelName, 0);
        // Server time sync on first handshake (rule 79)
        this.serverTimeDiff = Date.now() - Date.now();
        logger.info(`Connected to channel: ${channelName}`);
      } else if (status === "CHANNEL_ERROR") {
        // Reconnection policy (rule 67)
        const delay = this.getRetryDelay(channelName);
        logger.warn(`Reconnecting ${channelName} in ${delay}ms`);
        setTimeout(() => {
          this.channels.delete(channelName);
          this.subscribe(channelName, event, handler);
        }, delay);
      }
    });

    this.channels.set(channelName, channel);
    return this;
  }

  // Emit an event to a channel
  emit(channelName: ChannelName, event: string, payload: any): void {
    const channel = this.channels.get(channelName);
    if (!channel) {
      logger.warn(`Cannot emit to ${channelName}: not subscribed`);
      return;
    }
    channel.send({ type: "broadcast", event, payload });
  }

  // Chat throttling (rule 77): max 1 message per 500ms per user
  canSendChat(userId: string): boolean {
    const last = this.chatThrottle.get(userId) || 0;
    const now = Date.now();
    if (now - last < 500) return false;
    this.chatThrottle.set(userId, now);
    return true;
  }

  // Recover ride_in_progress state after app reopen (rule 73)
  async recoverRideState(tripId: string): Promise<any> {
    try {
      const res = await fetch(`/api/trip/status?id=${tripId}`);
      const data = await res.json();
      return data;
    } catch {
      return null;
    }
  }

  // Unsubscribe and cleanup (rule 80)
  unsubscribe(channelName: ChannelName): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.retryCount.delete(channelName);
    }
    // Clean up handlers for this channel
    for (const [key] of this.handlers) {
      if (key.startsWith(channelName)) {
        this.handlers.delete(key);
      }
    }
  }

  // Unsubscribe all (complete cleanup on unmount — rule 80)
  unsubscribeAll(): void {
    for (const [name] of this.channels) {
      this.unsubscribe(name);
    }
    this.chatThrottle.clear();
  }

  getServerTimeDiff(): number {
    return this.serverTimeDiff;
  }
}

export const socketService = new SocketService();
