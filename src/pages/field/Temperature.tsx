import SeasonalChart, { tabToSeasonalLookback, YAxisRangeConfig } from "@/components/charts/SeasonalChart";
import { TimeTab } from "@/components/charts/TimeTabs";
import { useSeasonalTemperature } from "@/state/seasonal/seasonalDataHooks";
import { useSeason } from "@/state/useSunData";
import { chartFormatters as f } from "@/utils/format";
import { cn } from "@/utils/utils";
import { useState, useMemo } from "react";

// Utility function to calculate better y-axis ranges for temperature data
const calculateTemperatureYAxisRanges = (data: Array<{ value: number }> | undefined): {
  [TimeTab.Week]?: YAxisRangeConfig;
  [TimeTab.Month]?: YAxisRangeConfig;
  [TimeTab.AllTime]?: YAxisRangeConfig;
} => {
  if (!data || data.length === 0) return {};

  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;

  // For temperature graphs, ensure a reasonable buffer that shows oscillation without being excessive
  // Use a percentage-based approach with a more conservative minimum
  const bufferPercentage = Math.max(range * 0.3, range + 2); // 30% of range or add 2pp to range, whichever is larger
  const percentageBuffer = Math.min(bufferPercentage, minValue * 0.1); // But cap it at 10% of the actual value

  const bufferMin = Math.max(0, minValue - percentageBuffer);
  const bufferMax = maxValue + percentageBuffer;

  const rangeConfig: YAxisRangeConfig = {
    min: bufferMin,
    max: bufferMax,
  };

  return {
    [TimeTab.Week]: rangeConfig,
    [TimeTab.Month]: rangeConfig,
    [TimeTab.AllTime]: rangeConfig,
  };
};

interface ITemperatureChartProps {
  chartWrapperClassName?: string;
  className?: string;
}

const TemperatureChart = ({ chartWrapperClassName, className }: ITemperatureChartProps) => {
  const [tempTab, setTempTab] = useState(TimeTab.Week);
  const season = useSeason();
  const tempData = useSeasonalTemperature(Math.max(0, season - tabToSeasonalLookback(tempTab)), season);

  // Calculate appropriate Y-axis ranges for temperature data
  const yAxisRanges = useMemo(() => {
    return calculateTemperatureYAxisRanges(tempData.data);
  }, [tempData.data]);

  return (
    <SeasonalChart
      title="Max Temperature"
      size="large"
      fillArea
      activeTab={tempTab}
      onChangeTab={setTempTab}
      useSeasonalResult={tempData}
      valueFormatter={f.percent2dFormatter}
      tickValueFormatter={f.percent0dFormatter}
      className={cn("bg-pinto-off-white border border-pinto-gray-2 h-[423px] lg:h-[435px]", className)}
      statVariant="non-colored"
      chartWrapperClassName={chartWrapperClassName}
      yAxisRanges={yAxisRanges}
    />
  );
};

export default TemperatureChart;
