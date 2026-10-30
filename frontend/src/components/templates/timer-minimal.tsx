"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export interface TimerMinimalProps {
  initialSeconds?: number;
  secondsRemaining?: number;
  className?: string;
  onExpire?: () => void;
  showIcon?: boolean;
}

export function TimerMinimal({
  initialSeconds = 300,
  secondsRemaining: controlledSeconds,
  className,
  onExpire,
  showIcon = true,
}: TimerMinimalProps) {
  const [seconds, setSeconds] = React.useState(controlledSeconds ?? initialSeconds);

  React.useEffect(() => {
    if (controlledSeconds !== undefined) {
      setSeconds(controlledSeconds);
      return;
    }

    if (seconds <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [controlledSeconds, seconds, onExpire]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds < 60;

  return (
    <div
      className={cn(
        "px-3.5 py-1.5 rounded-xl border flex items-center justify-center transition-all select-none shadow-xs",
        isUrgent
          ? "bg-destructive/10 border-destructive/40 text-destructive animate-pulse"
          : "bg-secondary/70 border-border text-foreground hover:bg-secondary",
        className
      )}
    >
      <div className="inline-flex items-center gap-1.5 text-base sm:text-lg font-mono font-bold tracking-wider">
        {showIcon && <Clock className="w-4 h-4 opacity-70" />}
        <span>{String(mins).padStart(2, "0")}</span>
        <span className="opacity-60">:</span>
        <span>{String(secs).padStart(2, "0")}</span>
      </div>
    </div>
  );
}

export default TimerMinimal;
