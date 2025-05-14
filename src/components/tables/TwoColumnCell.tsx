import { TableCell } from "@/components/ui/Table";
import { cn } from "@/utils/utils";
import TooltipSimple from "../TooltipSimple";

interface TwoColumnCellProps {
  className: string;
  columnKey: string;
  value: any;
  subValue: any;
  hoverContent?: any;
}

export const TwoColumnCell = ({
  className,
  columnKey,
  value,
  subValue,
  hoverContent,
}: TwoColumnCellProps): JSX.Element | null => {
  const itemAlignment = columnKey === "season" ? "items-start" : "items-end";
  const subValueSize = columnKey === "season" ? "text-[0.75rem]" : "text-sm";
  const cellContent = (
    <div className={`flex flex-col ${itemAlignment}`}>
      <span>{value}</span>
      <span className={`${subValueSize} break-keep text-pinto-gray-4`}>{subValue}</span>
    </div>
  );

  return hoverContent ? (
    <TableCell className={cn(className, "group")}>
      <TooltipSimple content={hoverContent} side="left">
        {cellContent}
      </TooltipSimple>
    </TableCell>
  ) : (
    <TableCell className={className}>{cellContent}</TableCell>
  );
};
