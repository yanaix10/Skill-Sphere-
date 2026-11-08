"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onValueChange,
  label,
  className,
  size = "default",
}) => {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex w-full items-center justify-center rounded-xl bg-secondary/80 text-muted-foreground border border-border select-none transition-all p-1",
        size === "sm" ? "h-9" : size === "lg" ? "h-12" : "h-11",
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "flex-1 h-full inline-flex items-center justify-center whitespace-nowrap rounded-lg px-2.5 text-sm font-sans font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer",
              isSelected
                ? "bg-background text-foreground font-semibold shadow-xs border-2 border-black dark:border-white"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border-2 border-transparent"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
