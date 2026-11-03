import React from "react";
import { cn } from "@/lib/utils";

interface TugOfWarBarProps {
  p1Name: string;
  p1Score: number;
  p2Name: string;
  p2Score: number;
  totalQuestions: number;
  p2Status?: string;
  className?: string;
}

export const TugOfWarBar: React.FC<TugOfWarBarProps> = ({
  p1Name,
  p1Score,
  p2Name,
  p2Score,
  totalQuestions,
  p2Status,
  className,
}) => {
  const safeTotal = Math.max(1, totalQuestions);
  const p1Percent = Math.min(100, Math.round((p1Score / safeTotal) * 100));
  const p2Percent = Math.min(100, Math.round((p2Score / safeTotal) * 100));

  const diff = p1Score - p2Score;
  let statusBadge = "TIED";
  let statusColor = "text-muted-foreground";

  if (diff > 0) {
    statusBadge = `+${diff} LEAD`;
    statusColor = "text-emerald-500";
  } else if (diff < 0) {
    statusBadge = `${diff} BEHIND`;
    statusColor = "text-rose-500";
  }

  return (
    <div className={cn("flex flex-col gap-2 w-full max-w-md mx-auto select-none", className)}>
      {/* Player Scores & Live Comparison */}
      <div className="flex items-center justify-between">
        {/* Player 1 (You) */}
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-2xl text-emerald-500 tracking-tight tabular-nums">
            {p1Score}
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-sans font-semibold text-foreground truncate max-w-[100px]">
              {p1Name || "You"}
            </span>
            <span className="text-[10px] font-sans text-muted-foreground">
              / {safeTotal} done
            </span>
          </div>
        </div>

        {/* Center Matchup Lead Status */}
        <div className="px-2.5 py-1 rounded-md bg-secondary/80 border border-border text-[11px] font-sans font-bold uppercase tracking-wider text-center">
          <span className={statusColor}>{statusBadge}</span>
        </div>

        {/* Player 2 (Opponent) */}
        <div className="flex items-center gap-2 text-right">
          <div className="flex flex-col items-end">
            <span className="text-xs font-sans font-semibold text-foreground truncate max-w-[100px]">
              {p2Name || "Opponent"}
            </span>
            <span className="text-[10px] font-sans text-muted-foreground">
              {p2Status ? (
                <span className="text-amber-500 font-medium">{p2Status}</span>
              ) : (
                `/ ${safeTotal} done`
              )}
            </span>
          </div>
          <span className="font-display font-bold text-2xl text-rose-500 tracking-tight tabular-nums">
            {p2Score}
          </span>
        </div>
      </div>

      {/* Real-time Bidirectional Progress Bar */}
      <div className="relative h-2 w-full bg-secondary rounded-full overflow-hidden flex items-center border border-border">
        {/* Center line notch */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-background z-10" />

        {/* Left Side: Player 1 (Emerald) */}
        <div className="h-full w-1/2 flex justify-end">
          <div
            style={{ width: `${p1Percent}%` }}
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-300 ease-out"
          />
        </div>

        {/* Right Side: Player 2 (Rose) */}
        <div className="h-full w-1/2 flex justify-start">
          <div
            style={{ width: `${p2Percent}%` }}
            className="h-full bg-rose-500 rounded-r-full transition-all duration-300 ease-out"
          />
        </div>
      </div>
    </div>
  );
};

export default TugOfWarBar;
