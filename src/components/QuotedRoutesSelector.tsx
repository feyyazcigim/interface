import { TV } from "@/classes/TokenValue";
import { SEEDS, STALK } from "@/constants/internalTokens";
import { SiloConvertResultResult } from "@/hooks/silo/useSiloConvertResult";
import { SiloConvertSummary } from "@/lib/siloConvert/SiloConvert";
import { SiloConvertType } from "@/lib/siloConvert/strategies/core";
import { formatter } from "@/utils/format";
import { Token } from "@/utils/types";
import { cn } from "@/utils/utils";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { Col } from "./Container";
import ConversionFlowDiagram from "./ConversionFlowDiagram";
import { Card, CardContent, CardHeader } from "./ui/Card";
import IconImage from "./ui/IconImage";

interface QuotedRoutesSelectorProps {
  quote: SiloConvertSummary<SiloConvertType>[] | undefined;
  convertResults: SiloConvertResultResult[] | undefined;
  sortedIndexes: number[] | undefined;
  routeIndex: number | undefined;
  sourceToken: Token;
  targetToken: Token;
  onRouteSelect: (index: number) => void;
}

interface RouteCardProps {
  routeNumber: number;
  result: SiloConvertResultResult;
  targetToken: Token;
  sourceToken: Token;
  isSelected: boolean;
  onClick: () => void;
  routeIndex: number;
  summary: SiloConvertSummary<SiloConvertType>;
}

function RouteCard({
  routeNumber,
  result,
  targetToken,
  sourceToken,
  isSelected,
  onClick,
  routeIndex,
  summary,
}: RouteCardProps) {
  const routeLabel = routeNumber === 1 ? "Best Route" : `${routeNumber}${getOrdinalSuffix(routeNumber)} Best`;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-lg border p-4 cursor-pointer transition-all duration-200",
        "hover:shadow-sm hover:border-border-dark",
        isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card",
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <CheckIcon className="h-3 w-3" />
        </div>
      )}

      {/* Route header */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-muted-foreground")}>
          {routeLabel}
        </span>
        <span className="text-xs text-muted-foreground">Route {routeIndex + 1}</span>
      </div>

      {/* Route metrics */}
      <div className="space-y-2">
        {/* Token Amount */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconImage src={targetToken.logoURI} size={4} className="h-4 w-4" />
            <span className="text-sm font-medium">Amount</span>
          </div>
          <span className="text-sm font-mono">
            {formatter.token(result.totalAmountOut, targetToken)} {targetToken.symbol}
          </span>
        </div>

        {/* BDV */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">BDV</span>
          <span className="text-sm font-mono">{formatter.token(result.toBdv, targetToken)}</span>
        </div>

        {/* Stalk */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconImage src={STALK.logoURI} size={4} className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">Stalk</span>
          </div>
          <span className={cn("text-sm font-mono", result.deltaStalk.gte(0) ? "text-green-600" : "text-red-600")}>
            {result.deltaStalk.gte(0) ? "+" : ""}
            {formatter.token(result.deltaStalk, STALK)}
          </span>
        </div>

        {/* Seeds */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconImage src={SEEDS.logoURI} size={4} className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">Seeds</span>
          </div>
          <span className={cn("text-sm font-mono", result.deltaSeed.gte(0) ? "text-green-600" : "text-red-600")}>
            {result.deltaSeed.gte(0) ? "+" : ""}
            {formatter.token(result.deltaSeed, SEEDS)}
          </span>
        </div>
      </div>

      {/* Conversion Flow Diagram */}
      <ConversionFlowDiagram
        convertType={summary.route.convertType}
        summary={summary}
        sourceToken={sourceToken}
        targetToken={targetToken}
      />
    </div>
  );
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}

export default function QuotedRoutesSelector({
  quote,
  convertResults,
  sortedIndexes,
  routeIndex,
  sourceToken,
  targetToken,
  onRouteSelect,
}: QuotedRoutesSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if we don't have multiple routes
  if (!quote || !convertResults || !sortedIndexes || quote.length <= 1) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Available Routes ({quote.length})</h3>
          <ChevronDownIcon
            className={cn("h-4 w-4 transition-transform duration-200", isExpanded ? "rotate-180" : "")}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <Col className="gap-2 w-full">
            {sortedIndexes.map((originalIndex, displayIndex) => {
              const result = convertResults[originalIndex];
              const summary = quote[originalIndex];
              if (!result || !summary) return null;

              return (
                <RouteCard
                  key={originalIndex}
                  routeNumber={displayIndex + 1}
                  result={result}
                  sourceToken={sourceToken}
                  targetToken={targetToken}
                  isSelected={routeIndex === originalIndex}
                  onClick={() => onRouteSelect(originalIndex)}
                  routeIndex={originalIndex}
                  summary={summary}
                />
              );
            })}
          </Col>
        </CardContent>
      )}
    </Card>
  );
}
