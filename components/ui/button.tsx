import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost" | "outline" | "destructive" | "gradient";
type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-green-500 text-white font-semibold shadow-[0_4px_20px_rgba(34,197,94,0.35)] hover:bg-green-400 hover:shadow-[0_4px_28px_rgba(34,197,94,0.5)] active:scale-[0.98]",
  gradient:
    "bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:from-green-400 hover:to-emerald-400 hover:shadow-[0_4px_28px_rgba(34,197,94,0.45)] active:scale-[0.98]",
  secondary:
    "[background:rgba(34,197,94,0.08)] [color:var(--text-primary)] [border:1px_solid_var(--border-default)] hover:[background:rgba(34,197,94,0.14)] hover:[border-color:var(--border-strong)] active:scale-[0.98]",
  ghost:
    "bg-transparent [color:var(--text-muted)] hover:[background:rgba(34,197,94,0.08)] hover:[color:var(--text-primary)] active:scale-[0.98]",
  outline:
    "[border:1px_solid_var(--border-default)] bg-transparent [color:var(--text-primary)] hover:[background:rgba(34,197,94,0.08)] hover:[border-color:var(--border-strong)] active:scale-[0.98]",
  destructive:
    "bg-rose-500/90 text-white hover:bg-rose-500 shadow-[0_4px_16px_rgba(239,68,68,0.25)] active:scale-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm:      "h-8 px-3 text-xs",
  lg:      "h-11 px-6 text-sm",
  icon:    "h-9 w-9 p-0",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild = false, variant = "default", size = "default", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-40",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
