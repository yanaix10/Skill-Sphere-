import * as React from "react";
import { cn } from "@/lib/utils";

export const Empty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col items-center justify-center p-8 text-center", className)}
      {...props}
    />
  )
);
Empty.displayName = "Empty";

export const EmptyHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col items-center space-y-2 mb-4", className)} {...props} />
  )
);
EmptyHeader.displayName = "EmptyHeader";

export const EmptyMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "icon" | "image" }
>(({ className, variant = "icon", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-center rounded-full bg-primary/10 text-primary p-3 mb-2",
      className
    )}
    {...props}
  />
));
EmptyMedia.displayName = "EmptyMedia";

export const EmptyTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />
  )
);
EmptyTitle.displayName = "EmptyTitle";

export const EmptyDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground max-w-sm", className)} {...props} />
  )
);
EmptyDescription.displayName = "EmptyDescription";

export const EmptyContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center justify-center gap-2 mt-4", className)} {...props} />
  )
);
EmptyContent.displayName = "EmptyContent";
