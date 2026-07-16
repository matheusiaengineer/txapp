"use client";

export function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string; delay?: number; direction?: string; distance?: number; duration?: number }) {
  return <div className={className}>{children}</div>;
}

export function StaggerSection({ children, className = "" }: { children: React.ReactNode; className?: string; staggerDelay?: number }) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
