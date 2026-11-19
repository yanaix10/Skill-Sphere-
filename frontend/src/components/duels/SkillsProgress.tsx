"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress-03-utils/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSkillsProgress } from "../../utils/quizStats";

export default function SkillsProgress() {
  const [mounted, setMounted] = useState(false);
  const skills = useSkillsProgress();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  const totalAttempted = skills.reduce((sum, s) => sum + s.attempted, 0);
  const avgAccuracy = skills.length > 0 ? Math.round(skills.reduce((sum, s) => sum + s.value, 0) / skills.length) : 0;

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-foreground">Skill Levels</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalAttempted > 0
              ? "Live progress calculated from your practice & duel tags"
              : "Frontend & system skills overview (updates as you practice)"}
          </p>
        </div>
        <Badge
          variant="outline"
          className="gap-1 border-teal-400/30 bg-teal-400/10 text-teal-600 dark:text-teal-400 font-semibold"
        >
          <TrendingUp className="size-3" />
          {totalAttempted > 0 ? `${avgAccuracy}% avg` : "Active"}
        </Badge>
      </div>

      <div className="space-y-4">
        {skills.map(({ label, value, attempted, color }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs sm:text-sm font-medium text-foreground">{label}</span>
              </div>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                {attempted > 0 ? (mounted ? `${value}%` : "0%") : "—"}
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${attempted > 0 && mounted ? Math.min(100, Math.max(0, value)) : 0}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
