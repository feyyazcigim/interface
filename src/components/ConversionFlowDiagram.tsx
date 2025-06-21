import { TV } from "@/classes/TokenValue";
import { SiloConvertSummary } from "@/lib/siloConvert/SiloConvert";
import { SiloConvertType } from "@/lib/siloConvert/strategies/core";
import { formatter } from "@/utils/format";
import { Token } from "@/utils/types";
import { ArrowDownIcon } from "@radix-ui/react-icons";
import IconImage from "./ui/IconImage";

interface ConversionFlowDiagramProps {
  convertType: SiloConvertType;
  summary: SiloConvertSummary<SiloConvertType>;
  sourceToken: Token;
  targetToken: Token;
}

interface FlowStepProps {
  children: React.ReactNode;
  className?: string;
}

function FlowStep({ children, className = "" }: FlowStepProps) {
  return (
    <div className={`flex items-center justify-center px-3 py-2 rounded-md border bg-muted/30 text-sm ${className}`}>
      {children}
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-1">
      <ArrowDownIcon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function TokenDisplay({ token, amount }: { token: Token; amount?: TV }) {
  return (
    <div className="flex items-center gap-1">
      <IconImage src={token.logoURI} size={4} className="h-4 w-4" />
      <span className="font-medium">{token.symbol}</span>
      {amount && <span className="text-muted-foreground">({formatter.token(amount, token)})</span>}
    </div>
  );
}

function LPAndMainFlow({
  summary,
  sourceToken,
  targetToken,
}: {
  summary: SiloConvertSummary<SiloConvertType>;
  sourceToken: Token;
  targetToken: Token;
}) {
  const isLPToMain = sourceToken.isLP && targetToken.isMain;
  const isMainToLP = sourceToken.isMain && targetToken.isLP;

  if (isLPToMain) {
    return (
      <div className="flex flex-col space-y-2">
        <FlowStep>
          <TokenDisplay token={sourceToken} />
        </FlowStep>
        <FlowArrow />
        <FlowStep className="bg-orange-50 border-orange-200 text-orange-800">Remove Single-Sided Liquidity</FlowStep>
        <FlowArrow />
        <FlowStep>
          <TokenDisplay token={targetToken} amount={summary.totalAmountOut} />
        </FlowStep>
      </div>
    );
  }

  if (isMainToLP) {
    return (
      <div className="flex flex-col space-y-2">
        <FlowStep>
          <TokenDisplay token={sourceToken} />
        </FlowStep>
        <FlowArrow />
        <FlowStep className="bg-green-50 border-green-200 text-green-800">Add Single-Sided Liquidity</FlowStep>
        <FlowArrow />
        <FlowStep>
          <TokenDisplay token={targetToken} amount={summary.totalAmountOut} />
        </FlowStep>
      </div>
    );
  }

  return null;
}

function LP2MainPipelineFlow({
  summary,
  sourceToken,
  targetToken,
}: {
  summary: SiloConvertSummary<SiloConvertType>;
  sourceToken: Token;
  targetToken: Token;
}) {
  const quote = summary.quotes[0];
  const swapQuote = quote?.summary.swap;

  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-2">
        <FlowStep>
          <TokenDisplay token={sourceToken} />
        </FlowStep>
        <FlowArrow />
        <FlowStep className="bg-orange-50 border-orange-200 text-orange-800">Remove Equal Proportions</FlowStep>
        {swapQuote && (
          <>
            <FlowArrow />
            <FlowStep className="bg-blue-50 border-blue-200 text-blue-800">
              <div className="flex items-center gap-2">
                <span>Swap</span>
                {swapQuote.sellToken && swapQuote.buyToken && (
                  <div className="flex items-center gap-1">
                    <IconImage src={swapQuote.sellToken.logoURI} size={4} className="h-4 w-4" />
                    <span>→</span>
                    <IconImage src={swapQuote.buyToken.logoURI} size={4} className="h-4 w-4" />
                  </div>
                )}
              </div>
            </FlowStep>
          </>
        )}
        <FlowArrow />
        <FlowStep>
          <TokenDisplay token={targetToken} amount={summary.totalAmountOut} />
        </FlowStep>
      </div>

      {swapQuote?.sellAmount && swapQuote?.buyAmount && (
        <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/20 rounded">
          <strong>Swap Details:</strong>
          <br />
          {formatter.token(swapQuote.sellAmount, swapQuote.sellToken)} →{" "}
          {formatter.token(swapQuote.buyAmount, swapQuote.buyToken)}
        </div>
      )}
    </div>
  );
}

function LP2LPFlow({
  summary,
  sourceToken,
  targetToken,
}: {
  summary: SiloConvertSummary<SiloConvertType>;
  sourceToken: Token;
  targetToken: Token;
}) {
  // Aggregate data from all strategies
  const hasSwaps = summary.quotes.some((quote) => quote.summary.swap);
  const totalSwapAmount = summary.quotes.reduce((total, quote) => {
    return quote.summary.swap?.sellAmount ? total.add(quote.summary.swap.sellAmount) : total;
  }, TV.ZERO);

  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-2">
        <FlowStep>
          <TokenDisplay token={sourceToken} />
        </FlowStep>
        <FlowArrow />
        <FlowStep className="bg-orange-50 border-orange-200 text-orange-800">Remove LP Liquidity</FlowStep>
        {hasSwaps && (
          <>
            <FlowArrow />
            <FlowStep className="bg-blue-50 border-blue-200 text-blue-800">Multi-Strategy Swaps</FlowStep>
          </>
        )}
        <FlowArrow />
        <FlowStep className="bg-green-50 border-green-200 text-green-800">Add LP Liquidity</FlowStep>
        <FlowArrow />
        <FlowStep>
          <TokenDisplay token={targetToken} amount={summary.totalAmountOut} />
        </FlowStep>
      </div>

      <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/20 rounded space-y-1">
        <div>
          <strong>Strategy Details:</strong>
        </div>
        <div>• {summary.quotes.length} conversion strategies used</div>
        {hasSwaps && totalSwapAmount.gt(0) && (
          <div>• Total swap volume: {formatter.number(totalSwapAmount.toNumber())}</div>
        )}
      </div>
    </div>
  );
}

export default function ConversionFlowDiagram({
  convertType,
  summary,
  sourceToken,
  targetToken,
}: ConversionFlowDiagramProps) {
  return (
    <div className="mt-3 p-3 bg-muted/10 rounded-md border border-muted">
      <div className="text-xs font-medium text-muted-foreground mb-3">Conversion Flow • {convertType}</div>

      {convertType === "LPAndMain" && (
        <LPAndMainFlow summary={summary} sourceToken={sourceToken} targetToken={targetToken} />
      )}

      {convertType === "LP2MainPipeline" && (
        <LP2MainPipelineFlow summary={summary} sourceToken={sourceToken} targetToken={targetToken} />
      )}

      {convertType === "LP2LP" && <LP2LPFlow summary={summary} sourceToken={sourceToken} targetToken={targetToken} />}
    </div>
  );
}
