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
  "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer border select-none outline-none",
  {
    variants: {
      status: {
        all: "border-border text-foreground hover:bg-surface-muted",
        saved: "border-border text-[var(--status-saved)] hover:bg-surface-muted",
        applied: "border-border text-[var(--status-applied)] hover:bg-surface-muted",
        interview: "border-border text-[var(--status-interview)] hover:bg-surface-muted",
        offer: "border-border text-[var(--status-offer)] hover:bg-surface-muted",
        rejected: "border-border text-[var(--status-rejected)] hover:bg-surface-muted",
      },
      active: {
        true: "bg-surface-muted border-border font-semibold shadow-xs ring-1 ring-border/80",
        false: "bg-surface hover:bg-surface-muted/60 opacity-80 hover:opacity-100",
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
        <span className="font-mono text-[12px] font-semibold tabular-nums ml-0.5 px-1.5 py-0.2 rounded bg-surface-muted/80 text-foreground border border-border/50">
          {count}
        </span>
      )}
    </button>
  );
};

export default StatChip;

