export interface AppNotification {
  id: string;
  type: "trip" | "payment" | "promotion" | "security" | "system" | "message" | "verification";
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  imageUrl?: string;
  priority: "low" | "normal" | "high" | "urgent";
}

export class NotificationService {
  private listeners: Array<() => void> = [];
  private channel: any = null;
  private userId: string | null = null;

  async init() {
    const { createClient } = await import("@/lib/supabase/browser");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    this.userId = user.id;
    this.channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => this.notifyListeners())
      .subscribe();
  }

  private async getSupabase() {
    const { createClient } = await import("@/lib/supabase/browser");
    return createClient();
  }

  async getAll(): Promise<AppNotification[]> {
    const supabase = await this.getSupabase();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data) return [];
    return data.map(this.mapRow);
  }

  async getUnread(): Promise<AppNotification[]> {
    const all = await this.getAll();
    return all.filter(n => !n.read);
  }

  async getUnreadCount(): Promise<number> {
    const supabase = await this.getSupabase();
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false);
    return count || 0;
  }

  async create(
    userId: string,
    type: AppNotification["type"],
    title: string,
    body: string,
    actionUrl?: string,
    data?: Record<string, string>,
  ) {
    const supabase = await this.getSupabase();
    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      body,
      action_url: actionUrl,
      data: data || {},
    });
  }

  async markAsRead(id: string): Promise<void> {
    const supabase = await this.getSupabase();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }

  async markAllAsRead(): Promise<void> {
    const supabase = await this.getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.getSupabase();
    await supabase.from("notifications").delete().eq("id", id);
  }

  async sendPush(title: string, body: string, data?: Record<string, string>): Promise<void> {
    const supabase = await this.getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await this.create(user.id, "system", title, body, data?.url, data);
    }
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon.png" });
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(fn => fn !== callback); };
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn());
  }

  private mapRow(row: any): AppNotification {
    return {
      id: row.id,
      type: row.type || "system",
      title: row.title,
      body: row.body || "",
      read: row.read || false,
      createdAt: row.created_at,
      actionUrl: row.action_url,
      data: row.data || {},
      priority: row.data?.priority || "normal",
    };
  }
}

export const notificationService = new NotificationService();
