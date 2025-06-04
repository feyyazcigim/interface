import { SMPChartType, useSeasonalMarketPerformance } from "@/state/seasonal/queries/useSeasonalMarketPerformance";
import { tabToSeasonalLookback } from "./SeasonalChart";
import { useState } from "react";
import { TimeTab } from "./TimeTabs";
import { SeasonalMarketPerformanceChartData } from "@/utils/types";

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
    SMPChartType.USD,
  );
  const data = seasonalPerformance.data;

  return <>todo</>;
};
export default MarketPerformanceChart;
