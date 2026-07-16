export interface CommunityPost {
  id: string; userId: string; userName: string; userAvatar?: string; userRole: string;
  content: string; imageUrl?: string; likes: number; comments: number;
  tags: string[]; createdAt: string; liked: boolean; saved: boolean;
}

export interface DriverRanking {
  driverId: string; name: string; avatar?: string; city: string;
  score: number; trips: number; rating: number; earnings: number; level: string;
}

export class SocialService {
  async getFeed(city?: string, page = 1): Promise<CommunityPost[]> {
    const messages = [
      "Bom dia pessoal! Mais um dia de trabalho.",
      "Alguém viu o trânsito na Marginal hoje?",
      "Dica: posto Shell na Av. Paulista tá com desconto!",
      "Bati minha meta diária! 🎉",
      "Cliente deixou gorjeta de R$10!",
      "Bora fazer um encontro de motoristas esse sábado?",
      "Alerta de blitz na Berrini pessoal!",
      "App tá voando hoje, melhor dia do mês!"
    ];
    return Array.from({ length: 10 }, (_, i) => ({
      id: `post_${page}_${i}`, userId: `u${i}`, userName: `Motorista ${i + 1}`, userRole: "driver",
      content: messages[i % messages.length],
      likes: Math.floor(Math.random() * 50), comments: Math.floor(Math.random() * 10),
      tags: ["dica", "trânsito", "meta", "encontro", "alerta", "promoção"],
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
      liked: false, saved: false,
    }));
  }

  async getLeaderboard(city?: string): Promise<DriverRanking[]> {
    return Array.from({ length: 20 }, (_, i) => ({
      driverId: `drv_${i}`, name: `Motorista ${i + 1}`, city: city || "São Paulo",
      score: 1000 - i * 45, trips: 500 - i * 20, rating: Math.round((5 - i * 0.1) * 10) / 10,
      earnings: 5000 - i * 200, level: i < 3 ? "Platina" : i < 8 ? "Ouro" : i < 15 ? "Prata" : "Bronze",
    }));
  }

  async getAchievements(driverId: string): Promise<{ id: string; name: string; icon: string; progress: number; unlocked: boolean; unlockedAt?: string }[]> {
    return [
      { id: "ach_1", name: "Primeira Corrida", icon: "🚀", progress: 100, unlocked: true, unlockedAt: new Date(Date.now() - 86400000 * 30).toISOString() },
      { id: "ach_2", name: "100 Corridas", icon: "🏆", progress: 78, unlocked: false },
      { id: "ach_3", name: "5 Estrelas", icon: "⭐", progress: 100, unlocked: true, unlockedAt: new Date(Date.now() - 86400000 * 15).toISOString() },
      { id: "ach_4", name: "Motorista do Mês", icon: "👑", progress: 45, unlocked: false },
      { id: "ach_5", name: "10k km Rodados", icon: "📏", progress: 62, unlocked: false },
      { id: "ach_6", name: "100 Gorjetas", icon: "💰", progress: 33, unlocked: false },
      { id: "ach_7", name: "Madrugueiro", icon: "🌙", progress: 100, unlocked: true, unlockedAt: new Date(Date.now() - 86400000 * 7).toISOString() },
      { id: "ach_8", name: "Indicação Premiada", icon: "👥", progress: 80, unlocked: false },
    ];
  }

  async reportIncident(type: string, description: string, location: { lat: number; lng: number }, photo?: string): Promise<{ id: string; status: string }> {
    return { id: "inc_" + Date.now(), status: "received" };
  }

  async getReferralLink(userId: string): Promise<string> { return `https://txd.app/r/${userId}`; }

  async getReferralStats(userId: string): Promise<{ invited: number; converted: number; earnings: number }> {
    return { invited: 12, converted: 8, earnings: 160 };
  }
}

export const socialService = new SocialService();
