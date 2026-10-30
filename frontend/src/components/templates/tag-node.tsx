"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TagElementProps {
  value: string;
  url?: string;
  selected?: boolean;
  focused?: boolean;
  readOnly?: boolean;
  className?: string;
  variant?: "default" | "easy" | "medium" | "hard" | "primary" | "secondary";
  onClick?: () => void;
  children?: React.ReactNode;
}

export function TagElement({
  value,
  url,
  selected,
  focused,
  readOnly,
  className,
  variant = "default",
  onClick,
  children,
}: TagElementProps) {
  const variantStyles = {
    default: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    secondary: "border-border bg-secondary/60 text-secondary-foreground hover:bg-secondary",
    primary: "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 font-mono",
    easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold",
    medium: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold",
    hard: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold",
  };

  const badge = (
    <div
      onClick={onClick}
      className={cn(
        "shrink-0 break-normal rounded-full border px-2.5 py-0.5 align-middle font-medium text-xs transition-colors focus:outline-none select-none",
        variantStyles[variant] || variantStyles.default,
        selected && focused && "ring-2 ring-ring ring-offset-0",
        "flex items-center gap-1.5",
        className
      )}
    >
      {value}
    </div>
  );

  if (url) {
    return (
      <a href={url} className="m-0.5 inline-flex select-none">
        {badge}
        {children}
      </a>
    );
  }

  return (
    <div className="m-0.5 inline-flex select-none">
      {badge}
      {children}
    </div>
  );
}

export default TagElement;
