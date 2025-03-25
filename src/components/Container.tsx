import { cn } from "@/utils/utils";
import React from "react";

export type InlineCenterSpanProps = React.HTMLAttributes<HTMLSpanElement> & {
  gap1?: boolean;
};

export const InlineCenterSpan = React.forwardRef<HTMLSpanElement, InlineCenterSpanProps>(
  ({ children, gap1 = false, ...props }, ref) => {
    return (
      <span {...props} ref={ref} className={cn("inline-flex items-center", gap1 && "gap-1", props.className)}>
        {children}
      </span>
    );
  },
);

export const Row = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div {...props} ref={ref} className={cn("flex flex-row items-center", className)} />;
  },
);

export const Col = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div {...props} ref={ref} className={cn("flex flex-col", className)} />;
  },
);
