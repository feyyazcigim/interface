import { SMPChartType, useSeasonalMarketPerformance } from "@/state/seasonal/queries/useSeasonalMarketPerformance";
import { chartFormatters as f, formatDate } from "@/utils/format";
import { getChainTokenMap } from "@/utils/token";
import { SeasonalMarketPerformanceChartData, Token } from "@/utils/types";
import { cn } from "@/utils/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useChainId } from "wagmi";
import { CloseIconAlt } from "../Icons";
import FrameAnimator from "../LoadingSpinner";
import TooltipSimple from "../TooltipSimple";
import IconImage from "../ui/IconImage";
import LineChart, { LineChartData } from "./LineChart";
import { tabToSeasonalLookback } from "./SeasonalChart";
import TimeTabsSelector, { TimeTab } from "./TimeTabs";
import { StrokeGradientFunction, gradientFunctions } from "./chartHelpers";

interface MarketPerformanceChartProps {
  season: number;
  size: "small" | "large" | "huge";
  className?: string;
}

type ChartDataset = {
  chartData: LineChartData[];
  // For the NET datapoint, there will be no token
  tokens: (Token | undefined)[];
  chartStrokeGradients: StrokeGradientFunction[];
};

const MarketPerformanceChart = ({ season, size, className }: MarketPerformanceChartProps) => {
  const chainId = useChainId();
  const [allData, setAllData] = useState<SeasonalMarketPerformanceChartData | null>(null);
  const [displayIndex, setDisplayIndex] = useState<number | null>(null);

  const [timeTab, setTimeTab] = useState(TimeTab.Week);
  const seasonalPerformance = useSeasonalMarketPerformance(
    Math.max(0, season - tabToSeasonalLookback(timeTab)),
    season,
    SMPChartType.USD_CUMULATIVE,
  );
  const data = seasonalPerformance.data;

  useEffect(() => {
    if (data && !allData) {
      // Filter out USDC
      const { USDC, ...rest } = data;
      setAllData(rest);
      setDisplayIndex(data.NET.length - 1);
    }
  }, [data, allData]);

  const chartDataset = useMemo<ChartDataset>(() => {
    if (allData) {
      const tokenConfig = Object.values(getChainTokenMap(chainId));

      const chartData: LineChartData[] = [];
      const tokens: (Token | undefined)[] = [];
      const chartStrokeGradients: StrokeGradientFunction[] = [];
      for (const token in allData) {
        for (let i = 0; i < allData[token].length; i++) {
          chartData[i] ??= {
            timestamp: allData[token][i].timestamp,
            values: [],
          };
          chartData[i].values.push(allData[token][i].value);
        }
        const tokenObj = tokenConfig.find((t) => t.symbol === token);
        tokens.push(tokenObj);
        chartStrokeGradients.push(gradientFunctions.solid(tokenObj?.color ?? "green"));
      }
      return {
        chartData,
        tokens,
        chartStrokeGradients,
      };
    }
    return { chartData: [], tokens: [], chartStrokeGradients: [] };
  }, [allData, chainId]);

  const handleChangeTimeTab = useCallback((tab: TimeTab) => {
    setTimeTab(tab);
    setAllData(null);
    setDisplayIndex(null);
  }, []);

  const handleMouseOver = useCallback(
    (index: number) => {
      if (allData) {
        setDisplayIndex(index ?? allData.NET.length - 1);
      }
    },
    [allData],
  );

  return (
    <div className={cn("rounded-[20px] bg-gray-1", className)}>
      <div className="flex justify-between pt-4 px-4 sm:pt-6 sm:px-6">
        <div className="flex flex-row gap-1 items-center">
          <div className="sm:pinto-body text-pinto-light sm:text-pinto-light">Crypto Market Performance</div>
          <TooltipSimple
            content="Measures historical fluctuations of non-Pinto value in the ecosystem."
            variant="gray"
          />
        </div>
        <TimeTabsSelector tab={timeTab} setTab={handleChangeTimeTab} />
      </div>
      {(!allData || displayIndex === null) && (
        <>
          {/* Keep sizing the same as when there is data. Allows centering spinner/error vertically */}
          <div
            className={`relative w-full flex items-center justify-center ${size === "small" || size === "huge" ? "aspect-3/1" : "aspect-6/1"}`}
            style={{
              paddingBottom: `calc(85px + ${size === "small" || size === "huge" ? "33.33%" : "16.67%"})`,
              height: "0",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {seasonalPerformance.isLoading && !seasonalPerformance.isError && <FrameAnimator size={75} />}
              {seasonalPerformance.isError && (
                <>
                  <CloseIconAlt color={"red"} />
                  <div className="pinto-body text-pinto-green-3">An error has occurred</div>
                </>
              )}
            </div>
          </div>
        </>
      )}
      {allData && displayIndex !== null && (
        <>
          <div className="h-[85px] px-4 sm:px-6">
            <div className="pinto-body sm:pinto-h3">
              <div className="flex flex-row items-center gap-3">
                {chartDataset.tokens.map((token, idx) => {
                  const tokenSymbol = token?.symbol ?? "NET";
                  return (
                    <div key={`${tokenSymbol}-value`} className="flex items-center">
                      {token && (
                        <IconImage src={token.logoURI} size={8} alt={token.symbol} className="inline-block mr-2" />
                      )}
                      <div style={{ color: token?.color }} className={`mr-2 ${!token?.color && "text-pinto-green-3"}`}>
                        {tokenSymbol === "NET" && "Total: "}
                        <p className="inline-block w-[7.1ch] text-right">
                          {f.largePriceFormatter({ decimals: 3, min: 1000000, uppercase: true })(
                            allData[tokenSymbol][displayIndex].value,
                          )}
                        </p>
                      </div>
                      {idx < Object.keys(allData).length - 1 && <p className="text-pinto-gray-2 mx-2">|</p>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-0 mt-2 sm:gap-2 sm:mt-3">
              <div className="pinto-xs sm:pinto-sm-light text-pinto-light sm:text-pinto-light">
                Season {allData.NET[displayIndex].season}
              </div>
              <div className="pinto-xs sm:pinto-sm-light text-pinto-light sm:text-pinto-light">
                {formatDate(allData.NET[displayIndex].timestamp)}
              </div>
            </div>
          </div>
          <div className={size === "small" || size === "huge" ? "aspect-3/1" : "aspect-6/1"}>
            {!chartDataset.chartData.length && !seasonalPerformance.isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="pinto-body-light">No data</div>
              </div>
            ) : (
              <div className={`px-4 pt-4 pb-4 ${size === "huge" ? "h-[550px]" : "h-[300px]"}`}>
                <LineChart
                  data={chartDataset.chartData}
                  xKey="timestamp"
                  size={"small"}
                  makeLineGradients={chartDataset.chartStrokeGradients}
                  valueFormatter={f.price0dFormatter}
                  onMouseOver={handleMouseOver}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default MarketPerformanceChart;
