import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "gold" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wide transition disabled:opacity-40 disabled:pointer-events-none",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" &&
          "bg-neon text-ink-950 shadow-glow hover:bg-emerald-300",
        variant === "gold" && "bg-gold text-ink-950 shadow-gold hover:bg-yellow-300",
        variant === "ghost" && "bg-white/5 hover:bg-white/10 text-slate-100",
        variant === "outline" && "border border-white/15 hover:border-neon/50 hover:text-neon",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-500",
        className,
      )}
      {...props}
    />
  );
}
