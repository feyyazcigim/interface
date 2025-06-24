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

  // For temperature graphs, ensure a minimum buffer of 1 percentage point
  // and scale the buffer based on the data range
  const minBuffer = 1; // 1 percentage point minimum buffer
  const percentageBuffer = Math.max(range * 0.15, minBuffer); // 15% of range or 1pp, whichever is larger

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
