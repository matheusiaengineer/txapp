export const TXD_THEME = {
  colors: {
    background: "#121212",
    foreground: "#ffffff",
    primary: "#3ECB8E",
    "primary-hover": "#34b37d",
    "primary-glow": "rgba(62, 203, 142, 0.3)",
    "card-bg": "#1c1c1c",
    "card-border": "rgba(255, 255, 255, 0.1)",
    muted: "#6b7280",
    accent: "#8B5CF6",
    "accent-glow": "rgba(139, 92, 246, 0.3)",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    neon: {
      green: "#3ECB8E",
      purple: "#8B5CF6",
      blue: "#3B82F6",
      pink: "#EC4899",
      orange: "#F97316",
      yellow: "#EAB308",
    },
  },
  glassmorphism: {
    background: "rgba(28, 28, 28, 0.84)",
    blur: "24px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    radius: "24px",
  },
  animation: {
    spring: { type: "spring" as const, stiffness: 200, damping: 15 },
    springLight: { type: "spring" as const, stiffness: 100, damping: 20 },
    transition: { duration: 0.3, ease: "easeOut" },
    transitionSlow: { duration: 0.6, ease: "easeOut" },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    heading: "font-bold tracking-tight",
    body: "text-gray-400",
    mono: "font-mono",
  },
  shadows: {
    primary: "0 0 15px rgba(62, 203, 142, 0.3)",
    card: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
    glow: (color: string) => `0 0 20px ${color}`,
  },
  breakpoints: {
    sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px",
  },
} as const;

export const SERVICE_COLORS: Record<string, string> = {
  moto: "#FF6B35", pop: "#3ECB8E", comfort: "#4A90D9", black: "#1A1A2E",
  van: "#9B59B6", executivo: "#2C3E50", pet: "#E67E22", bike: "#27AE60",
  group: "#3498DB", compartilhado: "#1ABC9C", acessivel: "#8E44AD",
  crianca: "#E91E63", feminino: "#FF69B4", carga_leve: "#E74C3C",
  carga_media: "#C0392B", carga_pesada: "#922B21", mudanca: "#D35400",
};
