import FrameAnimator from "@/components/LoadingSpinner.tsx";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CloseIconAlt } from "../Icons";
import LineChart, { LineChartData } from "./LineChart";
import { metallicGreenStrokeGradientFn } from "./chartHelpers";
import { tabToSeasonalLookback } from "./SeasonalChart";
import TimeTabsSelector, { TimeTab } from "./TimeTabs";
import { APY_EMA_WINDOWS, APYWindow, useSeasonalAPYs } from "@/state/seasonal/queries/useSeasonalAPY";
import { SeasonalAPYChartData, SeasonalAPYChartDataSingle } from "@/utils/types";

// TODO(pp): Does seasonal apy chart need any props at all?
interface SeasonalAPYChartProps {
  season: number;
  title: string;
  size: "small" | "large";
  valueFormatter: (value: number) => string;
  tickValueFormatter?: (value: number) => string;
  statVariant?: "explorer" | "non-colored";
  className?: string;
}

const greenStrokeGradients = [
  metallicGreenStrokeGradientFn,
  metallicGreenStrokeGradientFn,
  metallicGreenStrokeGradientFn,
];

const SeasonalAPYChart = ({
  season,
  title,
  size,
  valueFormatter,
  tickValueFormatter,
  statVariant = "explorer",
  className,
}: SeasonalAPYChartProps) => {
  const [allData, setAllData] = useState<SeasonalAPYChartData | null>(null);
  const [displayIndex, setDisplayIndex] = useState<number | null>(null);

  const [timeTab, setTimeTab] = useState(TimeTab.Week);
  const seasonalApy = useSeasonalAPYs(Math.max(0, season - tabToSeasonalLookback(timeTab)), season);
  const apyData = seasonalApy.data;

  useEffect(() => {
    if (apyData && !allData) {
      setAllData(apyData);
      setDisplayIndex(apyData[APYWindow.MONTHLY].length - 1);
    }
  }, [apyData, allData]);

  const handleChangeTab = useCallback((tab: TimeTab) => {
    setTimeTab(tab);
    setAllData(null);
    setDisplayIndex(null);
  }, []);

  const chartData = useMemo<LineChartData[]>(() => {
    if (allData) {
      // TODO(pp): handle potential desync in seasons? perhaps the useApy needs to have season as a key
      return APY_EMA_WINDOWS.reduce((acc, w) => {
        for (let i = 0; i < allData[w].length; i++) {
          acc[i] ??= {
            timestamp: allData[w][i].timestamp,
            values: [],
          };
          // Can't render 0 values on a log scale
          acc[i].values.push(Math.max(0.000001, allData[w][i].value));
        }
        return acc;
      }, [] as LineChartData[]);
    }
    return [];
  }, [allData]);

  const handleMouseOver = useCallback(
    (index: number) => {
      if (allData) {
        setDisplayIndex(index ?? allData[allData[APYWindow.MONTHLY].length - 1]);
      }
    },
    [allData],
  );

  return (
    <div className={cn("rounded-[20px] bg-gray-1", className)}>
      <div className="flex justify-between pt-4 px-4 sm:pt-6 sm:px-6">
        <div
          className={`${statVariant === "explorer" ? "sm:pinto-body text-pinto-light sm:text-pinto-light" : "sm:pinto-body-light text-pinto-primary sm:text-pinto-primary"} pinto-sm-light font-thin pb-0.5`}
        >
          {title}
        </div>
        <TimeTabsSelector tab={timeTab} setTab={handleChangeTab} />
      </div>

      {!allData && (
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
              {seasonalApy.isLoading && !seasonalApy.isError && <FrameAnimator size={75} />}
              {seasonalApy.isError && (
                <>
                  <CloseIconAlt color={"red"} />
                  <div className="pinto-body text-pinto-green-3">An error has occurred</div>
                </>
              )}
            </div>
          </div>
        </>
      )}
      {allData && (
        <>
          {/* <div className="h-[85px] px-4 sm:px-6">
            <div
              className={`${statVariant === "explorer" ? "text-pinto-green-3 sm:text-pinto-green-3" : "text-pinto-primary sm:text-pinto-primary"} pinto-body sm:pinto-h3`}
            >
              {valueFormatter(displayData.value)}
            </div>
            <div className="flex flex-col gap-0 mt-2 sm:gap-2 sm:mt-3">
              <div className="pinto-xs sm:pinto-sm-light text-pinto-light sm:text-pinto-light">
                Season {displayData.season}
              </div>
              <div className="pinto-xs sm:pinto-sm-light text-pinto-light sm:text-pinto-light">
                {formatDate(displayData.timestamp)}
              </div>
            </div>
          </div> */}
          <div className={size === "small" ? "aspect-3/1" : "aspect-6/1"}>
            {!chartData.length && !seasonalApy.isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="pinto-body-light">No data</div>
              </div>
            ) : (
              <div className="px-4 pt-4 pb-4 h-[300px]">
                <LineChart
                  data={chartData}
                  xKey="timestamp"
                  size={size}
                  makeLineGradients={greenStrokeGradients}
                  valueFormatter={tickValueFormatter}
                  onMouseOver={handleMouseOver}
                  useLogarithmicScale={true}
                  // yAxisMin={currentYAxisRange?.min}
                  // yAxisMax={currentYAxisRange?.max}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default SeasonalAPYChart;
