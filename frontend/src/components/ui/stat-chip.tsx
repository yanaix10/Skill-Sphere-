import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Bookmark,
  Send,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Briefcase,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ApplicationStatus =
  | "all"
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

const STATUS_ICONS: Record<ApplicationStatus, LucideIcon> = {
  all: Briefcase,
  saved: Bookmark,
  applied: Send,
  interview: MessageSquare,
  offer: CheckCircle2,
  rejected: XCircle,
};

const STATUS_DEFAULT_LABELS: Record<ApplicationStatus, string> = {
  all: "All applications",
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const statChipVariants = cva(
  "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer border select-none outline-none",
  {
    variants: {
      status: {
        all: "border-border/70 text-foreground hover:bg-card/50",
        saved: "border-border/70 text-[var(--status-saved,#3b82f6)] hover:bg-card/50",
        applied: "border-border/70 text-[var(--status-applied,#10b981)] hover:bg-card/50",
        interview: "border-border/70 text-[var(--status-interview,#f59e0b)] hover:bg-card/50",
        offer: "border-border/70 text-[var(--status-offer,#8b5cf6)] hover:bg-card/50",
        rejected: "border-border/70 text-[var(--status-rejected,#ef4444)] hover:bg-card/50",
      },
      active: {
        true: "bg-card/90 border-white/30 dark:border-white/20 font-bold shadow-xs text-foreground",
        false: "bg-card/40 hover:bg-card/70 backdrop-blur-sm border-white/10 dark:border-white/5 opacity-85 hover:opacity-100",
      },
    },
    defaultVariants: {
      status: "all",
      active: false,
    },
  }
);

export interface StatChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof statChipVariants> {
  status: ApplicationStatus;
  count?: number;
  label?: string;
  active?: boolean;
}

export const StatChip: React.FC<StatChipProps> = ({
  status = "all",
  count,
  label,
  active = false,
  className,
  ...props
}) => {
  const Icon = STATUS_ICONS[status];
  const displayLabel = label || STATUS_DEFAULT_LABELS[status];

  return (
    <button
      type="button"
      className={cn(statChipVariants({ status, active }), className)}
      {...props}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{displayLabel}</span>
      {typeof count === "number" && (
        <span className="font-mono text-[11px] font-bold tabular-nums ml-1 px-1.5 py-0.5 rounded-lg bg-card/60 backdrop-blur-xs text-foreground border border-white/15 dark:border-white/10 shadow-2xs">
          {count}
        </span>
      )}
    </button>
  );
};

export default StatChip;

