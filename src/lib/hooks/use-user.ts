"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

export interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: "passenger" | "driver" | "company" | "transporter" | "admin";
  phone: string;
  country: string;
  avatar_url?: string;
}

export function useUser() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);

    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (cancelled) return;
      clearTimeout(timeout);
      if (!authUser) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (!cancelled) {
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            phone: profile.phone || "",
            country: profile.country || "BR",
          });
        }
        setLoading(false);
      }
    }).catch(() => { if (!cancelled) { clearTimeout(timeout); setLoading(false); } });

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  return { user, loading };
}
