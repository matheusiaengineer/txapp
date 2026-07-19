"use client";

import { create } from "zustand";

interface ToastState {
  message: string | null;
  type: "success" | "error" | "info";
  visible: boolean;
  show: (msg: string, type?: "success" | "error" | "info") => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  type: "info",
  visible: false,
  show: (msg, type = "info") => {
    set({ message: msg, type, visible: true });
    setTimeout(() => set({ visible: false, message: null }), 3000);
  },
  hide: () => set({ visible: false, message: null }),
}));

export function Toast() {
  const { message, type, visible } = useToast();
  if (!visible || !message) return null;

  const bg = type === "success" ? "bg-primary" : type === "error" ? "bg-red-500" : "bg-blue-500";
  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[300] ${bg} text-background font-semibold px-6 py-3 rounded-2xl shadow-xl text-sm animate-bounce`}>
      {message}
    </div>
  );
}
