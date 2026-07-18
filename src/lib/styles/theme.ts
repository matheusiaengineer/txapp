/* TXDAPP Design Tokens
   Values must match globals.css custom properties exactly.
   This file is the JS/TS reference for dynamic styles. */

export const colors = {
  background: "#0a0d12",
  foreground: "#ffffff",
  primary: "#3ECB8E",
  "primary-hover": "#2da874",
  "primary-glow": "rgba(62, 203, 142, 0.3)",
  "card-bg": "#11151c",
  "card-bg-2": "#181d26",
  "card-border": "rgba(255, 255, 255, 0.06)",
  muted: "#6b7280",
  accent: "#8B5CF6",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
} as const;

export const neon = {
  green: "#3ECB8E",
  purple: "#8B5CF6",
  blue: "#3B82F6",
  pink: "#EC4899",
  orange: "#F97316",
  yellow: "#EAB308",
} as const;

export const serviceColors: Record<string, string> = {
  moto: "#FF6B35", pop: "#3ECB8E", comfort: "#4A90D9", black: "#1A1A2E",
  van: "#9B59B6", executivo: "#2C3E50", pet: "#E67E22", bike: "#27AE60",
  group: "#3498DB", compartilhado: "#1ABC9C", acessivel: "#8E44AD",
  crianca: "#E91E63", feminino: "#FF69B4", carga_leve: "#E74C3C",
  carga_media: "#C0392B", carga_pesada: "#922B21", mudanca: "#D35400",
};

export const glassmorphism = {
  panel: { background: "rgba(17, 21, 28, 0.84)", blur: "12px", border: "rgba(255, 255, 255, 0.06)", radius: "24px" },
  light: { background: "rgba(17, 21, 28, 0.5)", blur: "8px", border: "rgba(255, 255, 255, 0.05)", radius: "16px" },
  strong: { background: "rgba(17, 21, 28, 0.9)", blur: "16px", border: "rgba(255, 255, 255, 0.08)", radius: "0px" },
};

export const typography = {
  fontFamily: "Inter, sans-serif",
  sizes: {
    xs: "0.75rem",     /* 12px */
    sm: "0.875rem",    /* 14px */
    base: "1rem",      /* 16px */
    lg: "1.125rem",    /* 18px */
    xl: "1.25rem",     /* 20px */
    "2xl": "1.5rem",   /* 24px */
    "3xl": "1.875rem", /* 30px */
    "4xl": "2.25rem",  /* 36px */
    "5xl": "3rem",     /* 48px */
  },
  fluid: {
    hero: "clamp(1.5rem, 4vw, 4rem)",
    title: "clamp(1.25rem, 3vw, 2.25rem)",
    body: "clamp(0.875rem, 1.5vw, 1rem)",
  },
  weights: { normal: "400", medium: "500", semibold: "600", bold: "700", extrabold: "800" },
};

export const radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "32px",
  full: "9999px",
};

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "32px",
  "4xl": "40px",
  "5xl": "48px",
};

export const elevation = {
  flat: "0 0 0 rgba(0,0,0,0)",
  card: "0 4px 6px -1px rgba(0,0,0,0.3)",
  elevated: "0 8px 30px rgba(0,0,0,0.4)",
  modal: "0 20px 60px rgba(0,0,0,0.5)",
  glow: "0 0 20px rgba(62,203,142,0.25)",
  "glow-intense": "0 0 15px rgba(62,203,142,0.4), 0 0 30px rgba(62,203,142,0.2)",
};

export const animation = {
  spring: { type: "spring" as const, stiffness: 200, damping: 15 },
  springLight: { type: "spring" as const, stiffness: 100, damping: 20 },
  springStiff: { type: "spring" as const, stiffness: 300, damping: 25 },
  easeOut: { duration: 0.3, ease: "easeOut" as const },
  easeOutSlow: { duration: 0.6, ease: "easeOut" as const },
};

export const breakpoints = {
  sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px",
};

export const layout = {
  maxWidth: "1280px",
  sidebarWidth: "288px",
  bottomNavHeight: "64px",
  topNavHeight: "64px",
};
