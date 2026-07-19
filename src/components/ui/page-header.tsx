"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function PageHeader({ title, subtitle, showBack = true, rightAction }: PageHeaderProps) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3 mb-6">
      {showBack && (
        <button onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition shrink-0">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold truncate">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 truncate">{subtitle}</p>}
      </div>
      {rightAction}
    </div>
  );
}
