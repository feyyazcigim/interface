import { SMPChartType, useSeasonalMarketPerformance } from "@/state/seasonal/queries/useSeasonalMarketPerformance";
import { chartFormatters as f, formatDate } from "@/utils/format";
import { SeasonalMarketPerformanceChartData } from "@/utils/types";
import { cn } from "@/utils/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CloseIconAlt } from "../Icons";
import FrameAnimator from "../LoadingSpinner";
import TooltipSimple from "../TooltipSimple";
import LineChart, { LineChartData } from "./LineChart";
import { tabToSeasonalLookback } from "./SeasonalChart";
import TimeTabsSelector, { TimeTab } from "./TimeTabs";
import { gradientFunctions } from "./chartHelpers";

// TODO(pp): set these appropriately for each token. also filter usdc
const strokeGradients = [
  gradientFunctions.solidRed,
  gradientFunctions.solidBlue,
  gradientFunctions.solidGreen,
  gradientFunctions.solidRed,
  gradientFunctions.solidBlue,
  gradientFunctions.solidBlue,
];

interface MarketPerformanceChartProps {
  season: number;
  size: "small" | "large";
  className?: string;
}

const MarketPerformanceChart = ({ season, size, className }: MarketPerformanceChartProps) => {
  const [allData, setAllData] = useState<SeasonalMarketPerformanceChartData | null>(null);
  const [displayIndex, setDisplayIndex] = useState<number | null>(null);

  const [timeTab, setTimeTab] = useState(TimeTab.AllTime);
  const seasonalPerformance = useSeasonalMarketPerformance(
    Math.max(0, season - tabToSeasonalLookback(timeTab)),
    season,
    SMPChartType.USD_CUMULATIVE,
  );
  const data = seasonalPerformance.data;

  useEffect(() => {
    if (data && !allData) {
      setAllData(data);
      setDisplayIndex(data.NET.length - 1);
    }
  }, [data, allData]);

  const chartData = useMemo<LineChartData[]>(() => {
    if (allData) {
      const chartData: LineChartData[] = [];
      for (const token in allData) {
        for (let i = 0; i < allData[token].length; i++) {
          chartData[i] ??= {
            timestamp: allData[token][i].timestamp,
            values: [],
          };
          chartData[i].values.push(allData[token][i].value);
        }
      }
      return chartData;
    }
    return [];
  }, [allData]);

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
            className={`relative w-full flex items-center justify-center ${size === "small" ? "aspect-3/1" : "aspect-6/1"}`}
            style={{
              paddingBottom: `calc(85px + ${size === "small" ? "33.33%" : "16.67%"})`,
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
              {Object.keys(allData).map((token, idx) => {
                return (
                  <>
                    {/* style={{ color: chartColors[0].lineColor }} */}
                    <span key={`${token}-value`}>
                      {token}: {f.price0dFormatter(allData[token][displayIndex].value)}
                    </span>
                    {idx < Object.keys(allData).length - 1 && (
                      <span key={`${token}-separator`} className="mx-3 text-pinto-gray-2">
                        |
                      </span>
                    )}
                  </>
                );
              })}
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
          <div className={size === "small" ? "aspect-3/1" : "aspect-6/1"}>
            {!chartData.length && !seasonalPerformance.isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="pinto-body-light">No data</div>
              </div>
            ) : (
              <div className="px-4 pt-4 pb-4 h-[300px]">
                <LineChart
                  data={chartData}
                  xKey="timestamp"
                  size={size}
                  makeLineGradients={strokeGradients}
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
