import { cn } from "@/utils/utils";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useDialog } from "@react-aria/dialog";
import type { AriaDialogProps } from "@react-aria/dialog";
import { FocusScope } from "@react-aria/focus";
import { Overlay, useOverlay } from "@react-aria/overlays";
import React, { useRef } from "react";

interface NewAriaDialogProps extends AriaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isDismissable?: boolean;
  hideCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
  children: React.ReactNode;
}

export function AriaDialog({
  isOpen,
  onClose,
  isDismissable = true,
  hideCloseButton = false,
  className,
  overlayClassName,
  children,
  ...dialogProps
}: NewAriaDialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { overlayProps, underlayProps } = useOverlay(
    {
      isOpen,
      onClose,
      isDismissable,
    },
    ref,
  );

  const { dialogProps: ariaDialogProps } = useDialog(dialogProps, ref);

  if (!isOpen) return null;

  return (
    <Overlay>
      <div {...underlayProps} className={cn("fixed inset-0 z-50 bg-transparent h-[120dvh]", overlayClassName)} />
      <FocusScope contain restoreFocus autoFocus>
        <div
          ref={ref}
          {...overlayProps}
          {...ariaDialogProps}
          className={cn(
            "font-pinto fixed left-[50%] top-[50%] z-[51] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 sm:p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] rounded-[1rem]",
            className,
          )}
        >
          {children}
          {!hideCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 sm:right-6 sm:top-6 rounded-[1rem] opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-0 focus:ring-ring focus:ring-offset-0 disabled:pointer-events-none"
            >
              <Cross2Icon className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
          )}
        </div>
      </FocusScope>
    </Overlay>
  );
}
