"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: (string | SegmentedControlOption)[];
  value?: string;
  selectedValue?: string;
  onValueChange?: (value: string) => void;
  onChange?: (value: string) => void;
  label?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  selectedValue,
  onValueChange,
  onChange,
  label,
  className,
  size = "default",
}) => {
  const generatedId = React.useId();
  const layoutGroupId = label
    ? `segmented-${label.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`
    : `segmented-${generatedId}`;

  const normalizedOptions: SegmentedControlOption[] = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const activeValue = value !== undefined ? value : selectedValue !== undefined ? selectedValue : "";

  const handleSelect = (val: string) => {
    if (onValueChange) onValueChange(val);
    if (onChange) onChange(val);
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "relative inline-flex w-full items-center justify-center rounded-xl bg-secondary/80 dark:bg-[#161618] text-muted-foreground border border-border/80 dark:border-neutral-800/80 select-none p-1",
        size === "sm" ? "h-9" : size === "lg" ? "h-12" : "h-10",
        className
      )}
    >
      {normalizedOptions.map((option) => {
        const isSelected = option.value === activeValue;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "relative flex-1 h-full inline-flex items-center justify-center whitespace-nowrap rounded-lg px-2.5 text-xs sm:text-sm font-sans font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary z-0",
              isSelected
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isSelected && (
              <motion.div
                layoutId={layoutGroupId}
                className="absolute inset-0 rounded-lg bg-background dark:bg-neutral-800 shadow-sm border border-border/70 dark:border-neutral-700/70"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 truncate select-none">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
