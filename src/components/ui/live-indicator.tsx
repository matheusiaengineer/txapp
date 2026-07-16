"use client";

import { useState, useEffect } from "react";

export function LiveIndicator({ label, interval = 5000 }: { label: string; interval?: number }) {
  const [num, setNum] = useState(47);

  useEffect(() => {
    const t = setInterval(() => {
      setNum((prev) => Math.max(10, prev + Math.floor(Math.random() * 6) - 3));
    }, interval);
    return () => clearInterval(t);
  }, [interval]);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      {label}: {num}
    </span>
  );
}
