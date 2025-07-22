import { deriveTextStyles } from "@/utils/theme";
import { Prettify } from "@/utils/types.generic";
import { cn } from "@/utils/utils";
import { ExclamationTriangleIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { VariantProps, cva } from "class-variance-authority";
import clsx from "clsx";

const infoProps = clsx("bg-pinto-gray-1 border border-pinto-gray-2 rounded-lg");
const warningProps = clsx("bg-pinto-red-1 border border-pinto-red-2 text-pinto-red-2 rounded-lg");
const cautionProps = clsx(
  "bg-pinto-warning-yellow/10 border border-pinto-warning-yellow text-pinto-warning-yellow rounded-lg",
);

const warningVariants = cva(
  `flex flex-row items-center p-4 gap-2 text-black ${deriveTextStyles("sm-light")} rounded-xl`,
  {
    variants: {
      variant: {
        info: infoProps,
        warning: warningProps,
        caution: cautionProps,
      },
    },
  },
);

type WarningVariantProps = VariantProps<typeof warningVariants>;

const variantToIcon = {
  info: InfoCircledIcon,
  warning: ExclamationTriangleIcon,
  caution: ExclamationTriangleIcon,
} as const;

export type WarningProps = React.HTMLAttributes<HTMLDivElement> &
  Prettify<WarningVariantProps> & {
    showIcon?: boolean;
  };

const Warning = ({ children, variant = "info", className, showIcon = true, ...props }: WarningProps) => {
  const Icon = variant ? variantToIcon[variant] : InfoCircledIcon;

  return (
    <div
      {...props}
      className={cn(
        warningVariants({
          variant,
        }),
        className,
      )}
    >
      {showIcon && (
        <div className="w-4 h-4 min-w-4 min-h-4 max-h-4 max-w-4 mr-1">
          <Icon color={"currentColor"} />
        </div>
      )}
      {children}
    </div>
  );
};

export default Warning;
