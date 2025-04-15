import { SeasonsTableData } from "@/state/useSeasonsData";
import { SowEvent } from "@/state/useSowEventData";
import { formatter } from "@/utils/format";
import { caseIdToDescriptiveText } from "@/utils/season";
import { Separator } from "@radix-ui/react-separator";
import { useMemo } from "react";
import { LineChartData } from "./LineChart";
import MultiLineChart from "./MultiLineChart";
import { metallicGreenStrokeGradientFn } from "./chartHelpers";

interface DeltaDemandChartProps {
  currentSeason: SeasonsTableData;
  surroundingSeasons: SeasonsTableData[];
  filteredSowEvents: Record<number, SowEvent[]>;
}

export interface SowEventTimings {
  events: {
    blocksSinceSunrise: bigint;
    timestampAsMin: number;
    sownBeans: number;
  }[];
  availableSoil: number;
}

const makeLineGradients = [metallicGreenStrokeGradientFn];

export const DeltaDemandChart = ({ currentSeason, surroundingSeasons, filteredSowEvents }: DeltaDemandChartProps) => {
  if (!surroundingSeasons[0] || !surroundingSeasons[1]) {
    return null;
  }
  const descriptiveText = caseIdToDescriptiveText(currentSeason.caseId, "soil_demand");

  const sowEventTimings = {
    [currentSeason.season]: {
      events: filteredSowEvents[currentSeason.season]?.map((event) => {
        const blocksSinceSunrise = event.blockNumber - BigInt(currentSeason.sunriseBlock);
        return {
          sownBeans: Number(event.args.beans) / 1000000,
          blocksSinceSunrise,
          timestampAsMin: (Number(blocksSinceSunrise) * 2) / 60,
        };
      }),
      availableSoil: currentSeason.issuedSoil.toNumber(),
    },
    [surroundingSeasons[1].season]: {
      events: filteredSowEvents[surroundingSeasons[1].season]?.map((event) => {
        const blocksSinceSunrise = event.blockNumber - BigInt(surroundingSeasons[1].sunriseBlock);
        return {
          sownBeans: Number(event.args.beans) / 1000000,
          blocksSinceSunrise,
          timestampAsMin: (Number(blocksSinceSunrise) * 2) / 60,
        };
      }),
      availableSoil: surroundingSeasons[1].issuedSoil.toNumber(),
    },
  };
  const isChartReady = Object.values(sowEventTimings).every((timings) => !!timings);

  const mappedData = useMemo(() => {
    const labels: string[] = [];
    const data: Record<number, LineChartData[]> = {};
    const indexesWithSowEvents: number[] = [];
    // number of blocks is not necessarily 1,800, depends when gm was called
    const numBlocks = Math.max(
      surroundingSeasons[0].sunriseBlock - currentSeason.sunriseBlock,
      surroundingSeasons[1].sunriseBlock - surroundingSeasons[0].sunriseBlock,
    );

    Object.entries(sowEventTimings).forEach(([key, timings], idx) => {
      if (!data[idx]) {
        data[idx] = [];
      }
      let cumulativeSownBeans = 0;
      for (let i = 0; i < numBlocks; i++) {
        const sowEvent = timings.events.find((timing) => BigInt(timing.blocksSinceSunrise) === BigInt(i));
        const timePrefix = i < 1800 ? "XX" : "XY";
        const textInterval = `${timePrefix}:${Math.trunc((Number(i) * 2) / 60)}`;
        if (sowEvent) {
          labels.push("XX");
          cumulativeSownBeans += sowEvent.sownBeans;
          data[idx].push({
            values: [(cumulativeSownBeans / timings.availableSoil) * 100 || 0],
            interval: textInterval,
          });
          indexesWithSowEvents.push(i);
        } else {
          labels.push(textInterval);
          data[idx].push({
            values: [(cumulativeSownBeans / timings.availableSoil) * 100 || 0],
            interval: textInterval,
          });
        }
      }
    });
    return data;
  }, [sowEventTimings]);

  return (
    <div className="w-[600px] bg-white">
      <span>Demand for Soil is {descriptiveText}</span>
      <div className="flex text-sm mt-2 gap-1 items-center">
        <div className="rounded-full w-3 h-3 bg-pinto-green-4" />
        <span>Season {currentSeason.season}</span>
        <span className="text-pinto-gray-4">({currentSeason.temperature}% Temp)</span>
        <span>-</span>
        <span className="text-pinto-gray-4">Amount Sown:</span>
        <span>
          {currentSeason.deltaSownBeans.toNumber().toFixed(2)}/{currentSeason.issuedSoil.toNumber().toFixed(2)}
        </span>
        <span className="text-pinto-gray-4">
          ({((currentSeason.deltaSownBeans.toNumber() / currentSeason.issuedSoil.toNumber()) * 100 || 0).toFixed(2)}
          %)
        </span>
      </div>
      <div className="flex text-sm mt-2 gap-1 items-center">
        <div className="rounded-full w-3 h-3 bg-pinto-morning-yellow-1" />
        <span>Season {surroundingSeasons[1].season}</span>
        <span className="text-pinto-gray-4">({surroundingSeasons[1].temperature}% Temp)</span>
        <span>-</span>
        <span className="text-pinto-gray-4">Amount Sown:</span>
        <span>
          {surroundingSeasons[1].deltaSownBeans.toNumber().toFixed(2)}/
          {surroundingSeasons[1].issuedSoil.toNumber().toFixed(2) || 0.0}
        </span>
        <span className="text-pinto-gray-4">
          (
          {(
            (surroundingSeasons[1].deltaSownBeans.toNumber() / surroundingSeasons[1].issuedSoil.toNumber()) * 100 || 0
          ).toFixed(2)}
          %)
        </span>
      </div>

      <div className="w-full h-[250px] rounded-md mt-2 flex justify-center items-center relative">
        {isChartReady && (
          <>
            <MultiLineChart
              data={mappedData}
              size="large"
              xKey="interval"
              makeLineGradients={makeLineGradients}
              valueFormatter={formatter.pct}
            />
            <div className="absolute bg-morning-light opacity-50 left-[12px] w-[90px] h-[220px] top-[7px] " />
          </>
        )}
      </div>
      <Separator className="my-4" />
      <div className="flex flex-col">
        <span className="text-base">Demand for Soil</span>
        <span className="text-xl">{descriptiveText}</span>
        {currentSeason.blocksToSoldOutSoil === "-" ? (
          <span className="text-base mt-4 text-pinto-gray-4">
            Amount of Soil Sown in {currentSeason.season}: {currentSeason.deltaSownBeans.toNumber().toFixed(2)}
          </span>
        ) : (
          <span className="text-base mt-4 text-pinto-gray-4">
            Soil - {currentSeason.issuedSoil.toNumber().toFixed(2)} Sown in Season {currentSeason.season}: XX:
            {currentSeason.blocksToSoldOutSoil}
          </span>
        )}
        {surroundingSeasons[1].blocksToSoldOutSoil === "-" ? (
          <span className="text-base text-pinto-gray-4">
            Amount of Soil Sown in {surroundingSeasons[1].season}:{" "}
            {surroundingSeasons[1].deltaSownBeans.toNumber().toFixed(2)}
          </span>
        ) : (
          <span className="text-base text-pinto-gray-4">
            Soil - {surroundingSeasons[1].issuedSoil.toNumber().toFixed(2)} Sown in Season{" "}
            {surroundingSeasons[1].season}: XX:
            {surroundingSeasons[1].blocksToSoldOutSoil}
          </span>
        )}
      </div>
    </div>
  );
};
