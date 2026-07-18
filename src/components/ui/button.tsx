"use client";

import { forwardRef, type ButtonHTMLAttributes, type ForwardedRef } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-black hover:bg-primary-hover shadow-lg shadow-primary/20",
  secondary: "bg-white/5 text-white hover:bg-white/10 border border-white/10",
  ghost: "text-gray-300 hover:text-white hover:bg-white/5",
  outline: "bg-transparent text-primary border border-primary/40 hover:bg-primary/10",
  danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
  success: "bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-5 py-2.5 text-base rounded-xl gap-2",
  xl: "px-6 py-3 text-base rounded-2xl gap-2.5",
};

export const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading, icon, children, className = "", disabled, ...props }: ButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center font-semibold transition-all select-none",
        "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
        "whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : icon}
      {children}
    </button>
  );
});
