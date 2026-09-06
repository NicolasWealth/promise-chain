import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: { primary: "cc-tag bg-ink px-5 py-3 text-lime hover:bg-lime-soft hover:text-ink", accent: "cc-tag bg-lime px-5 py-3 text-ink hover:bg-lime-soft", outline: "border border-rule bg-panel px-5 py-3 text-foreground hover:border-foreground", ghost: "px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground", danger: "border border-danger/25 bg-danger-soft px-5 py-3 text-danger hover:bg-danger/15" },
    size: { default: "", sm: "px-3 py-2 text-xs", lg: "px-6 py-3.5", icon: "size-9 p-0" },
  },
  defaultVariants: { variant: "primary", size: "default" },
});

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={buttonVariants({ variant, size, className })} {...props} />;
});
Button.displayName = "Button";
