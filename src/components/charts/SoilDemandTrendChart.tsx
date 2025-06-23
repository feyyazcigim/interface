import FrameAnimator from "@/components/LoadingSpinner.tsx";
import { formatDate } from "@/utils/format";
import { UseSeasonalResult } from "@/utils/types";
import { cn } from "@/utils/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CloseIconAlt } from "../Icons";
import TooltipSimple from "../TooltipSimple";
import TimeTabsSelector, { TimeTab } from "./TimeTabs";
import { tabToSeasonalLookback } from "./SeasonalChart";

export interface SoilDemandTrendData {
  season: number;
  value: number;
  timestamp: Date;
  trend: "increasing" | "steady" | "decreasing";
}

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

const getDemandTrend = (deltaPodDemand: number): "increasing" | "steady" | "decreasing" => {
  if (deltaPodDemand >= HIGH_DEMAND_THRESHOLD) {
    return "increasing";
  } else if (deltaPodDemand >= STEADY_DEMAND_THRESHOLD) {
    return "steady";
  } else {
    return "decreasing";
  }
};

const getTrendColor = (trend: "increasing" | "steady" | "decreasing"): string => {
  switch (trend) {
    case "increasing":
      return "#22c55e"; // green-500
    case "steady":
      return "#f59e0b"; // amber-500
    case "decreasing":
      return "#ef4444"; // red-500
    default:
      return "#6b7280"; // gray-500
  }
};

const getTrendLabel = (trend: "increasing" | "steady" | "decreasing"): string => {
  switch (trend) {
    case "increasing":
      return "High Demand";
    case "steady":
      return "Steady Demand";
    case "decreasing":
      return "Low Demand";
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

  const trendData = useMemo((): SoilDemandTrendData[] => {
    if (!useSeasonalResult.data) return [];

    return useSeasonalResult.data.map((item) => ({
      season: item.season,
      value: item.value,
      timestamp: item.timestamp,
      trend: getDemandTrend(item.value),
    }));
  }, [useSeasonalResult.data]);

  const latestTrend = trendData[trendData.length - 1]?.trend || "decreasing";
  const latestSeason = trendData[trendData.length - 1]?.season || 0;

  // Count trends for summary stats
  const trendCounts = useMemo(() => {
    const counts = { increasing: 0, steady: 0, decreasing: 0 };
    trendData.forEach((item) => {
      counts[item.trend]++;
    });
    return counts;
  }, [trendData]);

  const handleTooltipClick = useCallback(() => {
    setIsTooltipVisible(!isTooltipVisible);
  }, [isTooltipVisible]);

  const handleTooltipClose = useCallback(() => {
    setIsTooltipVisible(false);
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

  if (useSeasonalResult.isError || !trendData.length) {
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
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>High Demand: Fast soil consumption</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span>Steady Demand: Moderate consumption</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Low Demand: Slow consumption</span>
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
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getTrendColor(latestTrend) }}></div>
          <span className="text-lg font-semibold text-gray-900">{getTrendLabel(latestTrend)}</span>
          <span className="text-sm text-gray-500">Season {latestSeason}</span>
        </div>
      </div>

      {/* Trend Timeline */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Trend History</h4>
        <div className="flex flex-wrap gap-1">
          {trendData.slice(-20).map((item, index) => (
            <div key={item.season} className="group relative">
              <div
                className="w-3 h-8 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: getTrendColor(item.trend) }}
                title={`Season ${item.season}: ${getTrendLabel(item.trend)} (${formatDate(item.timestamp)})`}
              ></div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Season {trendData[Math.max(0, trendData.length - 20)]?.season || 0}</span>
          <span>Season {latestSeason}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{trendCounts.increasing}</div>
            <div className="text-xs text-gray-500">High Demand</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{trendCounts.steady}</div>
            <div className="text-xs text-gray-500">Steady Demand</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{trendCounts.decreasing}</div>
            <div className="text-xs text-gray-500">Low Demand</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoilDemandTrendChart;
