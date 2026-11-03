import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomCodeBadgeProps {
  code: string;
  className?: string;
  onCopied?: () => void;
}

export const RoomCodeBadge: React.FC<RoomCodeBadgeProps> = ({
  code,
  className,
  onCopied,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (onCopied) onCopied();
    setTimeout(() => setCopied(false), 2000);
  };

  const letters = (code || "------").split("").slice(0, 6);

  return (
    <div
      onClick={handleCopy}
      title="Click to copy Room Code"
      className={cn(
        "group inline-flex items-center gap-2 p-1.5 px-3 rounded-xl bg-secondary/80 border border-border hover:border-primary/50 transition-all duration-200 cursor-pointer shadow-xs select-none",
        className
      )}
    >
      <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
        Room
      </span>

      <div className="flex items-center gap-1">
        {letters.map((char, idx) => (
          <span
            key={idx}
            className="w-6 h-7 rounded-md bg-background border border-border/70 flex items-center justify-center font-mono font-bold text-xs text-foreground group-hover:border-primary/40 group-hover:text-primary transition-colors shadow-2xs"
          >
            {char}
          </span>
        ))}
      </div>

      <div className="p-1 rounded-md text-muted-foreground group-hover:text-foreground transition-colors ml-0.5">
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in-75 duration-150" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </div>
    </div>
  );
};

