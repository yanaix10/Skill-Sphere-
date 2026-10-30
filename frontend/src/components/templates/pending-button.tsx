"use client";

import * as React from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PendingButtonProps extends React.ComponentProps<typeof Button> {
  isPending?: boolean;
  pendingText?: string;
  variantColor?: "green" | "default" | "primary";
}

export function PendingButton({
  isPending = false,
  pendingText = "Submitting...",
  variantColor = "green",
  className,
  children = "Submit Quiz",
  disabled,
  ...props
}: PendingButtonProps) {
  const colorStyles = {
    green:
      "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-md shadow-emerald-950/20 font-bold border-none",
    default: "",
    primary:
      "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md",
  };

  return (
    <Button
      disabled={disabled || isPending}
      className={cn(
        "gap-2 transition-all cursor-pointer font-semibold",
        colorStyles[variantColor],
        className
      )}
      {...props}
    >
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin shrink-0" />
          <span>{pendingText}</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{children}</span>
        </>
      )}
    </Button>
  );
}

export default PendingButton;
