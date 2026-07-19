"use client";

import React, { Suspense } from "react";
import { SkeletonList } from "@/components/ui/skeleton";

interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazySection({ children, fallback }: LazySectionProps) {
  return (
    <Suspense fallback={fallback || <SkeletonList count={3} />}>
      {children}
    </Suspense>
  );
}
