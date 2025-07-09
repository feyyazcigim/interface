import { cn } from "@/utils/utils";
import { VariantProps, cva } from "class-variance-authority";
import * as React from "react";

export interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  containerClassName?: string;
  borders?: boolean;
  isError?: boolean;
}

const inputVariants = cva("rounded-[0.75rem] transition-colors overflow-hidden", {
  variants: {
    outlined: {
      false: "group border border-input",
      true: "group focus-within:border-pinto-green border-[1px] border-pinto-gray-2 focus-within:ring-ring",
    },
    isError: {
      true: "border-destructive focus-visible:border-destructive focus-within:border-destructive focus:border-destructive",
    },
  },
});

export type InputProps = VariantProps<typeof inputVariants> & BaseInputProps;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, containerClassName, type, startIcon, endIcon, outlined, isError, ...props }, ref) => {
    return (
      <div
        className={cn(
          "relative",
          inputVariants({
            outlined,
            isError,
          }),
          containerClassName,
        )}
      >
        {startIcon && <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none">{startIcon}</div>}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-[0.75rem] border-none bg-white px-3 py-1 text-[1.25rem] group text-black shadow-none transition-colors file:border-0 file:bg-transparent file:text-[1.25rem] file:font-medium placeholder:text-pinto-gray-3 focus-visible:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            "disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield]",
            !outlined && "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            startIcon && "pl-10",
            endIcon && "pr-10",
            className,
          )}
          ref={ref}
          {...props}
        />
        {endIcon && <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">{endIcon}</div>}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
