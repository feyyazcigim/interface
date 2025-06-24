import SeasonalChart, { tabToSeasonalLookback, YAxisRangeConfig } from "@/components/charts/SeasonalChart";
import { TimeTab } from "@/components/charts/TimeTabs";
import {
  useSeasonalPodLine,
  useSeasonalPodRate,
  useSeasonalPodsHarvested,
  useSeasonalSownPinto,
  useSeasonalTemperature,
} from "@/state/seasonal/seasonalDataHooks";
import { useSunData } from "@/state/useSunData";
import { chartFormatters as f } from "@/utils/format";
import React, { useState, useMemo } from "react";
import FieldTemperatureBarChart from "../field/FieldTemperatureBarChart";

const FieldExplorer = () => {
  const season = useSunData().current;

  return (
    <>
      <div className="flex flex-col sm:flex-row w-full sm:space-x-8">
        <div className="w-full sm:w-1/2">
          <FieldTemperatureBarChart variant="explorer" />
        </div>
        <div className="w-full sm:w-1/2">
          <PodRateChart season={season} />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row w-full sm:space-x-8">
        <div className="w-full sm:w-1/2">
          <MaxTempChart season={season} />
        </div>
        <div className="w-full sm:w-1/2">
          <PodLineChart season={season} />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row w-full sm:space-x-8">
        <div className="w-full sm:w-1/2">
          <SownPintoChart season={season} />
        </div>
        <div className="w-full sm:w-1/2">
          <PodsHarvestedChart season={season} />
        </div>
      </div>
    </>
  );
};
export default FieldExplorer;

interface ISeason {
  season: number;
}

const useTimeTabs = () => useState(TimeTab.Week);

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
  const percentageBuffer = Math.min(bufferPercentage, minValue * 0.01); // But cap it at 1% of the actual value

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

const PodRateChart = React.memo(({ season }: ISeason) => {
  const [podRateTab, setPodRateTab] = useTimeTabs();

  const podRateData = useSeasonalPodRate(Math.max(0, season - tabToSeasonalLookback(podRateTab)), season);

  return (
    <SeasonalChart
      title="Pod Rate"
      tooltip="The ratio of Unharvestable Pods per Pinto. The Pod Rate is used by Pinto as a proxy for its health."
      size="small"
      fillArea
      activeTab={podRateTab}
      onChangeTab={setPodRateTab}
      useSeasonalResult={podRateData}
      valueFormatter={f.percent2dFormatter}
      tickValueFormatter={f.percent0dFormatter}
    />
  );
});

const MaxTempChart = React.memo(({ season }: ISeason) => {
  const [tempTab, setTempTab] = useTimeTabs();

  const tempData = useSeasonalTemperature(Math.max(0, season - tabToSeasonalLookback(tempTab)), season);

  // Calculate appropriate Y-axis ranges for temperature data
  const yAxisRanges = useMemo(() => {
    return calculateTemperatureYAxisRanges(tempData.data);
  }, [tempData.data]);

  return (
    <SeasonalChart
      title="Max Temperature"
      tooltip="The maximum interest rate for Sowing Pinto."
      size="small"
      activeTab={tempTab}
      onChangeTab={setTempTab}
      useSeasonalResult={tempData}
      valueFormatter={f.percent2dFormatter}
      tickValueFormatter={f.percent0dFormatter}
      yAxisRanges={yAxisRanges}
    />
  );
});

const PodLineChart = React.memo(({ season }: ISeason) => {
  const [podlineTab, setPodlineTab] = useTimeTabs();

  const podIndexData = useSeasonalPodLine(Math.max(0, season - tabToSeasonalLookback(podlineTab)), season);

  return (
    <SeasonalChart
      title="Pod Line"
      tooltip="The total number of Unharvestable Pods."
      size="small"
      fillArea
      activeTab={podlineTab}
      onChangeTab={setPodlineTab}
      useSeasonalResult={podIndexData}
      valueFormatter={f.number0dFormatter}
      tickValueFormatter={f.largeNumberFormatter}
    />
  );
});

const SownPintoChart = React.memo(({ season }: ISeason) => {
  const [sownTab, setSownTab] = useTimeTabs();

  const sownData = useSeasonalSownPinto(Math.max(0, season - tabToSeasonalLookback(sownTab)), season);

  return (
    <SeasonalChart
      title="Sown Pinto"
      tooltip="The total number of Pinto Sown."
      size="small"
      fillArea
      activeTab={sownTab}
      onChangeTab={setSownTab}
      useSeasonalResult={sownData}
      valueFormatter={f.number0dFormatter}
      tickValueFormatter={f.largeNumberFormatter}
    />
  );
});

const PodsHarvestedChart = React.memo(({ season }: ISeason) => {
  const [harvestedTab, setHarvestedTab] = useTimeTabs();

  const harvestData = useSeasonalPodsHarvested(Math.max(0, season - tabToSeasonalLookback(harvestedTab)), season);

  return (
    <SeasonalChart
      title="Pods Harvested"
      tooltip="The total number of Pods Harvested."
      size="small"
      fillArea
      activeTab={harvestedTab}
      onChangeTab={setHarvestedTab}
      useSeasonalResult={harvestData}
      valueFormatter={f.number0dFormatter}
      tickValueFormatter={f.largeNumberFormatter}
    />
  );
});
