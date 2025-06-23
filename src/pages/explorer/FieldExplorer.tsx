import SeasonalChart, { tabToSeasonalLookback } from "@/components/charts/SeasonalChart";
import { TimeTab } from "@/components/charts/TimeTabs";
import {
  useSeasonalCultivationFactor,
  useSeasonalPodLine,
  useSeasonalPodRate,
  useSeasonalPodsHarvested,
  useSeasonalSoilDemand,
  useSeasonalSoilDemandTrend,
  useSeasonalSoilSupply,
  useSeasonalSownPinto,
  useSeasonalTemperature,
} from "@/state/seasonal/seasonalDataHooks";
import { useSunData } from "@/state/useSunData";
import { chartFormatters as f } from "@/utils/format";
import React, { useState } from "react";
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
      <div className="flex flex-col sm:flex-row w-full sm:space-x-8">
        <div className="w-full sm:w-1/3">
          <SoilSupplyChart season={season} />
        </div>
        <div className="w-full sm:w-1/3">
          <CultivationFactorChart season={season} />
        </div>
        <div className="w-full sm:w-1/3">
          <SoilDemandTrend season={season} />
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

const CultivationFactorChart = React.memo(({ season }: ISeason) => {
  const [cultivationTab, setCultivationTab] = useTimeTabs();

  const cultivationData = useSeasonalCultivationFactor(
    Math.max(0, season - tabToSeasonalLookback(cultivationTab)),
    season,
  );

  return (
    <SeasonalChart
      title="Cultivation Factor"
      tooltip="Protocol Controlled Value to control soil issuance"
      size="small"
      activeTab={cultivationTab}
      onChangeTab={setCultivationTab}
      useSeasonalResult={cultivationData}
      valueFormatter={f.percent2dFormatter}
      tickValueFormatter={f.percent0dFormatter}
    />
  );
});

const SoilSupplyChart = React.memo(({ season }: ISeason) => {
  const [soilSupplyTab, setSoilSupplyTab] = useTimeTabs();

  const soilSupplyData = useSeasonalSoilSupply(Math.max(0, season - tabToSeasonalLookback(soilSupplyTab)), season);

  return (
    <SeasonalChart
      title="Soil Supply per Season"
      tooltip="The amount of Soil available for Sowing each Season."
      size="small"
      fillArea
      activeTab={soilSupplyTab}
      onChangeTab={setSoilSupplyTab}
      useSeasonalResult={soilSupplyData}
      valueFormatter={f.number0dFormatter}
      tickValueFormatter={f.largeNumberFormatter}
    />
  );
});

const SoilDemandTrend = React.memo(({ season }: ISeason) => {
  const [soilDemandTab, setSoilDemandTab] = useTimeTabs();

  const soilDemandTrendData = useSeasonalSoilDemandTrend(
    Math.max(0, season - tabToSeasonalLookback(soilDemandTab)),
    season,
  );

  // Custom formatter to show trend labels
  const trendFormatter = (value: number) => {
    if (value >= 1) return "Increasing";
    if (value >= 0) return "Steady";
    return "Decreasing";
  };

  const trendTickFormatter = (value: number) => {
    if (value >= 1) return "↗";
    if (value >= 0) return "→";
    return "↘";
  };

  return (
    <SeasonalChart
      title="Soil Demand Trend"
      tooltip="Shows whether soil demand is increasing (high), steady (moderate), or decreasing (low) based on consumption speed and patterns."
      size="small"
      fillArea
      activeTab={soilDemandTab}
      onChangeTab={setSoilDemandTab}
      useSeasonalResult={soilDemandTrendData}
      valueFormatter={trendFormatter}
      tickValueFormatter={trendTickFormatter}
    />
  );
});
