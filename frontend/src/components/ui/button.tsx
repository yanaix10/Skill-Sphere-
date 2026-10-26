import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-cyan-500 text-black shadow hover:bg-cyan-400 font-semibold",
        destructive:
          "bg-red-500/90 text-white shadow-sm hover:bg-red-500",
        outline:
          "border border-white/10 bg-transparent shadow-sm hover:bg-white/5 hover:text-white text-zinc-300",
        secondary:
          "bg-zinc-800 text-zinc-100 shadow-sm hover:bg-zinc-700",
        ghost:
          "hover:bg-white/10 hover:text-white text-zinc-400",
        link:
          "text-cyan-400 underline-offset-4 hover:underline",
        discord:
          "bg-[#5865f2] text-white hover:bg-[#4752c4] font-medium shadow",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
