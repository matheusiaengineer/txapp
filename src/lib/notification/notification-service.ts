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
  private notifications: AppNotification[] = [];
  private listeners: Array<(notifications: AppNotification[]) => void> = [];

  constructor() {
    this.loadMock();
  }

  private loadMock() {
    const mockNotifications: AppNotification[] = [
      { id: "n1", type: "trip", title: "Motorista a caminho", body: "João está a caminho. ETA: 3 min.", read: false, createdAt: new Date(Date.now() - 300000).toISOString(), priority: "high", actionUrl: "/ride/active" },
      { id: "n2", type: "payment", title: "Pagamento recebido", body: "R$ 25,50 da corrida para Av. Paulista.", read: false, createdAt: new Date(Date.now() - 3600000).toISOString(), priority: "normal", actionUrl: "/wallet" },
      { id: "n3", type: "promotion", title: "Bônus de final de semana", body: "Ganhe 20% a mais em corridas até domingo!", read: false, createdAt: new Date(Date.now() - 7200000).toISOString(), priority: "low", actionUrl: "/promotions" },
      { id: "n4", type: "security", title: "Alerta de segurança", body: "Sua corrida saiu da rota esperada.", read: true, createdAt: new Date(Date.now() - 86400000).toISOString(), priority: "urgent", actionUrl: "/ride/active" },
      { id: "n5", type: "system", title: "Documento aprovado", body: "Sua CNH foi verificada com sucesso!", read: true, createdAt: new Date(Date.now() - 172800000).toISOString(), priority: "normal", actionUrl: "/verification" },
      { id: "n6", type: "message", title: "Nova mensagem", body: "Passageiro: 'Estou na porta'", read: false, createdAt: new Date(Date.now() - 60000).toISOString(), priority: "high", actionUrl: "/chat" },
      { id: "n7", type: "verification", title: "Verificação pendente", body: "Seu selfie ainda não foi aprovada.", read: false, createdAt: new Date(Date.now() - 259200000).toISOString(), priority: "high", actionUrl: "/verification" },
    ];
    this.notifications = mockNotifications;
  }

  async getAll(): Promise<AppNotification[]> {
    return [...this.notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUnread(): Promise<AppNotification[]> {
    return this.notifications.filter(n => !n.read);
  }

  async markAsRead(id: string): Promise<void> {
    const n = this.notifications.find(n => n.id === id);
    if (n) n.read = true;
    this.notifyListeners();
  }

  async markAllAsRead(): Promise<void> {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  async delete(id: string): Promise<void> {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  async sendPush(title: string, body: string, data?: Record<string, string>): Promise<void> {
    const n: AppNotification = {
      id: "n_" + Date.now(), type: "system", title, body, data,
      read: false, createdAt: new Date().toISOString(), priority: "normal",
    };
    this.notifications.unshift(n);
    this.notifyListeners();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon.png" });
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  async getUnreadCount(): Promise<number> {
    return this.notifications.filter(n => !n.read).length;
  }

  subscribe(callback: (notifications: AppNotification[]) => void): () => void {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(fn => fn !== callback); };
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn(this.notifications));
  }
}

export const notificationService = new NotificationService();
