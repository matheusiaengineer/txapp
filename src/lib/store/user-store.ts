"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserState {
  id: string | null;
  email: string | null;
  name: string | null;
  role: "passenger" | "driver" | "company" | "transporter" | "employee" | "admin" | null;
  avatar: string | null;
  isVerified: boolean;
  token: string | null;
  isAuthenticated: boolean;

  setUser: (user: Partial<UserState>) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      id: null,
      email: null,
      name: null,
      role: null,
      avatar: null,
      isVerified: false,
      token: null,
      isAuthenticated: false,

      setUser: (user) => set((state) => ({ ...state, ...user, isAuthenticated: true })),
      setToken: (token) => set({ token }),
      logout: () => set({
        id: null, email: null, name: null, role: null, avatar: null,
        isVerified: false, token: null, isAuthenticated: false,
      }),
    }),
    {
      name: "txd-user",
      partialize: (state) => ({
        token: state.token,
        id: state.id,
        role: state.role,
      }),
    }
  )
);
