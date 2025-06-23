import FrameAnimator from "@/components/LoadingSpinner.tsx";
import { UseSeasonalResult } from "@/utils/types";
import { cn } from "@/utils/utils";
import { useCallback, useMemo, useState } from "react";
import { CloseIconAlt } from "../Icons";
import TooltipSimple from "../TooltipSimple";
import LineChart, { LineChartData } from "./LineChart";
import { tabToSeasonalLookback } from "./SeasonalChart";
import TimeTabsSelector, { TimeTab } from "./TimeTabs";
import { metallicMorningAreaGradientFn, metallicMorningStrokeGradientFn } from "./chartHelpers";

interface SoilDemandTrendChartProps {
  title: string;
  tooltip: string;
  size: "small" | "large";
  activeTab: TimeTab;
  onChangeTab: (tab: TimeTab) => void;
  useSeasonalResult: UseSeasonalResult;
  className?: string;
}

// Based on LibEvaluate.sol constants:
// HIGH_DEMAND_THRESHOLD = 1e18 = 1,000,000,000,000,000,000
const HIGH_DEMAND_THRESHOLD = 1e18;
const STEADY_DEMAND_THRESHOLD = 1; // Minimum floor for steady demand

const getDemandTrendValue = (deltaPodDemand: number): number => {
  if (deltaPodDemand >= HIGH_DEMAND_THRESHOLD) {
    return 1; // Increasing
  } else if (deltaPodDemand >= STEADY_DEMAND_THRESHOLD) {
    return 0; // Steady
  } else {
    return -1; // Decreasing
  }
};

const getTrendLabel = (value: number): string => {
  switch (value) {
    case 1:
      return "Increasing";
    case 0:
      return "Steady";
    case -1:
      return "Decreasing";
    default:
      return "Unknown";
  }
};

const SoilDemandTrendChart: React.FC<SoilDemandTrendChartProps> = ({
  title,
  tooltip,
  size,
  activeTab,
  onChangeTab,
  useSeasonalResult,
  className,
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const chartData = useMemo((): LineChartData[] => {
    if (!useSeasonalResult.data) return [];

    return useSeasonalResult.data.map((item) => ({
      season: item.season,
      timestamp: item.timestamp,
      values: [getDemandTrendValue(item.value)],
    }));
  }, [useSeasonalResult.data]);

  const latestTrend = chartData[chartData.length - 1]?.values[0] ?? -1;
  const latestSeason = chartData[chartData.length - 1]?.season ?? 0;

  // Count trends for summary stats
  const trendCounts = useMemo(() => {
    const counts = { increasing: 0, steady: 0, decreasing: 0 };
    chartData.forEach((item) => {
      const trend = item.values[0];
      if (trend === 1) counts.increasing++;
      else if (trend === 0) counts.steady++;
      else if (trend === -1) counts.decreasing++;
    });
    return counts;
  }, [chartData]);

  const handleTooltipClick = useCallback(() => {
    setIsTooltipVisible(!isTooltipVisible);
  }, [isTooltipVisible]);

  const handleTooltipClose = useCallback(() => {
    setIsTooltipVisible(false);
  }, []);

  // Custom value formatter for y-axis
  const valueFormatter = useCallback((value: number) => {
    return getTrendLabel(value);
  }, []);

  if (useSeasonalResult.isLoading) {
    return (
      <div
        className={cn("bg-white rounded-lg shadow-sm border", size === "small" ? "p-4 h-64" : "p-6 h-80", className)}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <TimeTabsSelector tab={activeTab} setTab={onChangeTab} />
        </div>
        <div className="flex items-center justify-center h-full">
          <FrameAnimator />
        </div>
      </div>
    );
  }

  if (useSeasonalResult.isError || !chartData.length) {
    return (
      <div
        className={cn("bg-white rounded-lg shadow-sm border", size === "small" ? "p-4 h-64" : "p-6 h-80", className)}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <TimeTabsSelector tab={activeTab} setTab={onChangeTab} />
        </div>
        <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-sm border", size === "small" ? "p-4" : "p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="relative">
            <button
              onClick={handleTooltipClick}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Show tooltip"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {isTooltipVisible && (
              <TooltipSimple>
                <div className="p-3 max-w-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Soil Demand Trends</span>
                    <button onClick={handleTooltipClose} className="text-gray-400 hover:text-gray-600">
                      <CloseIconAlt className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{tooltip}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Increasing: Fast soil consumption (≥1e18)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span>Steady: Moderate consumption (≥1)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Decreasing: Low consumption (&lt;1)</span>
                    </div>
                  </div>
                </div>
              </TooltipSimple>
            )}
          </div>
        </div>
        <TimeTabsSelector tab={activeTab} setTab={onChangeTab} />
      </div>

      {/* Current Status */}
      <div className="mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">Current Trend:</span>
          <span className="text-lg font-semibold text-gray-900">{getTrendLabel(latestTrend)}</span>
          <span className="text-sm text-gray-500">Season {latestSeason}</span>
        </div>
      </div>

      {/* Line Chart */}
      <div className={cn("relative", size === "small" ? "h-48" : "h-64")}>
        <LineChart
          data={chartData}
          size={size}
          xKey="season"
          makeLineGradients={[metallicMorningStrokeGradientFn]}
          makeAreaGradients={[metallicMorningAreaGradientFn]}
          valueFormatter={valueFormatter}
          yAxisMin={-1.2}
          yAxisMax={1.2}
        />
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-green-600">{trendCounts.increasing}</div>
            <div className="text-xs text-gray-500">Increasing</div>
          </div>
          <div>
            <div className="text-xl font-bold text-amber-600">{trendCounts.steady}</div>
            <div className="text-xs text-gray-500">Steady</div>
          </div>
          <div>
            <div className="text-xl font-bold text-red-600">{trendCounts.decreasing}</div>
            <div className="text-xs text-gray-500">Decreasing</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoilDemandTrendChart;
