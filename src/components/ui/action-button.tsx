"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useState, useCallback, useRef, forwardRef } from "react";

type ActionButtonVariant = "primary" | "secondary" | "destructive" | "ghost" | "outline";

interface ActionButtonProps {
  variant?: ActionButtonVariant;
  loading?: boolean;
  throttle?: number;
  destructive?: boolean;
  confirmMessage?: string;
  fixedWidth?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onAction?: () => Promise<void> | void;
}

const variantClasses: Record<ActionButtonVariant, string> = {
  primary: "bg-primary text-black hover:bg-primary-hover shadow-lg shadow-primary/20",
  secondary: "bg-white/5 text-white hover:bg-white/10 border border-white/10",
  destructive: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
  ghost: "text-gray-300 hover:text-white hover:bg-white/5",
  outline: "bg-transparent text-primary border border-primary/40 hover:bg-primary/10",
};

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
  {
    variant = "primary",
    loading = false,
    throttle,
    destructive,
    confirmMessage = "Tem certeza?",
    fixedWidth = true,
    disabled,
    children,
    onClick,
    onAction,
    className = "",
  },
  ref,
) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const lastClickRef = useRef(0);
  const isMountedRef = useRef(true);

  const isActuallyLoading = loading || internalLoading;
  const isDisabled = disabled || isActuallyLoading || locked;

  const handleClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;

    if (onClick) onClick(e);
    if (e.defaultPrevented) return;

    if (throttle) {
      const now = Date.now();
      if (now - lastClickRef.current < throttle) return;
      lastClickRef.current = now;
    }

    if (destructive && !confirmStep) {
      setConfirmStep(true);
      setTimeout(() => { if (isMountedRef.current) setConfirmStep(false); }, 3000);
      e.preventDefault();
      return;
    }

    setConfirmStep(false);
    if (!onAction) return;

    setInternalLoading(true);
    try {
      await onAction();
      setFailureCount(0);
    } catch {
      const newCount = failureCount + 1;
      setFailureCount(newCount);
      if (newCount >= 3) setLocked(true);
    } finally {
      if (isMountedRef.current) setInternalLoading(false);
    }
  }, [isDisabled, throttle, destructive, confirmStep, onClick, onAction, failureCount]);

  if (locked) {
    return (
      <div className="text-xs text-red-400 text-center py-2">
        Tente novamente mais tarde
      </div>
    );
  }

  return (
    <motion.button
      ref={ref}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      onClick={handleClick}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center font-semibold rounded-xl transition-all text-sm",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        fixedWidth ? "min-w-[120px]" : "",
        confirmStep ? "animate-pulse border-red-400 border" : "",
        className,
      ].join(" ")}
    >
      {isActuallyLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : confirmStep ? (
        <span className="text-red-400">{confirmMessage}</span>
      ) : (
        children
      )}
    </motion.button>
  );
});
