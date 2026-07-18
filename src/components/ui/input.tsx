"use client";

import { forwardRef, useState, type InputHTMLAttributes, type ForwardedRef } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  showPasswordToggle?: boolean;
  icon?: React.ReactNode;
}

export const Input = forwardRef(function Input(
  { label, error, hint, showPasswordToggle, icon, className = "", type, ...props }: InputProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  const [showPassword, setShowPassword] = useState(false);
  const resolvedType = showPasswordToggle && type === "password"
    ? (showPassword ? "text" : "password")
    : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-300">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={resolvedType}
          className={[
            "w-full bg-white/5 border text-white placeholder-gray-500",
            "transition-all duration-200 outline-none",
            "focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "min-h-[48px] text-base",
            icon ? "pl-10" : "pl-4",
            showPasswordToggle && type === "password" ? "pr-12" : "pr-4",
            error ? "border-red-500/50" : "border-white/10",
            "rounded-xl",
            className,
          ].join(" ")}
          {...props}
        />
        {showPasswordToggle && type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
});
