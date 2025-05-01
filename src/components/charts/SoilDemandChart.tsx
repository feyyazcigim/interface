import { SeasonsTableData } from "@/state/useSeasonsData";
import { SowEvent } from "@/state/useSowEventData";
import { formatter } from "@/utils/format";
import { caseIdToDescriptiveText } from "@/utils/season";
import { Separator } from "@radix-ui/react-separator";
import { useMemo } from "react";
import SoilDemandMultiLineChart, { SoilDemandMultiLineChartData } from "./SoilDemandMultiLineChart";

interface SoilDemandChartProps {
  currentSeason: SeasonsTableData;
  previousSeason: SeasonsTableData;
  nextBlock: number;
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

const calculateTimestampTitle = (num: number) => {
  const min = Math.trunc((Number(num) * 2) / 60);
  const sec = Math.trunc((Number(num) * 2) % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${sec}`;
};

export const SoilDemandChart = ({
  currentSeason,
  nextBlock,
  previousSeason,
  filteredSowEvents,
}: SoilDemandChartProps) => {
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
    [previousSeason.season]: {
      events: filteredSowEvents[previousSeason.season]?.map((event) => {
        const blocksSinceSunrise = event.blockNumber - BigInt(previousSeason.sunriseBlock);
        return {
          sownBeans: Number(event.args.beans) / 1000000,
          blocksSinceSunrise,
          timestampAsMin: (Number(blocksSinceSunrise) * 2) / 60,
        };
      }),
      availableSoil: previousSeason.issuedSoil.toNumber(),
    },
  };
  const isChartReady = Object.values(sowEventTimings).every((timings) => !!timings);

  const mappedData = useMemo(() => {
    const labels: string[] = [];
    const data: Record<number, SoilDemandMultiLineChartData[]> = {};
    const indexesWithSowEvents: number[] = [];
    const numBlocksPerSeasons = {
      [currentSeason.season]: nextBlock - currentSeason.sunriseBlock,
      [previousSeason.season]: currentSeason.sunriseBlock - previousSeason.sunriseBlock,
    };

    Object.entries(sowEventTimings).forEach(([key, timings], idx) => {
      if (!data[idx]) {
        data[idx] = [];
      }
      // number of blocks is not necessarily 1,800, depends when gm was called
      const numBlocks = Math.max(...Object.values(numBlocksPerSeasons));
      const numBlocksForSeason = numBlocksPerSeasons[key];
      let cumulativeSownBeans = 0;
      for (let i = 0; i < numBlocks; i++) {
        // usually one event but w/ tractor multiple can happen in the same block
        const sowEvents = timings.events.filter((timing) => BigInt(timing.blocksSinceSunrise) === BigInt(i));
        const timePrefix = i < 1800 ? "XX" : "XY";
        const textInterval = `${timePrefix}:${calculateTimestampTitle(i)}`;
        const cumulativeSownBeansForBlock = sowEvents.reduce((acc, sowEvent) => acc + sowEvent.sownBeans, 0);
        // as far as available soil, label, and textInterval, all sowEvents are the same
        if (sowEvents[0]) {
          labels.push("XX");
          cumulativeSownBeans += cumulativeSownBeansForBlock;
          // This is really only for the current season, if only 20min have elapsed, only draw 20min worth of chart data for that line
          data[idx].push({
            values: i > numBlocksForSeason ? [null] : [(cumulativeSownBeans / timings.availableSoil) * 100 || 0],
            interval: textInterval,
          });
          indexesWithSowEvents.push(i);
        } else {
          labels.push(textInterval);
          // This is really only for the current season, if only 20min have elapsed, only draw 20min worth of chart data for that line
          data[idx].push({
            values: i > numBlocksForSeason ? [null] : [(cumulativeSownBeans / timings.availableSoil) * 100 || 0],
            interval: textInterval,
          });
        }
      }
    });
    return data;
  }, [currentSeason.sunriseBlock, nextBlock, previousSeason.sunriseBlock]);

  return (
    <div className="w-[350px] lg:w-[600px] bg-white">
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
        <span>Season {previousSeason.season}</span>
        <span className="text-pinto-gray-4">({previousSeason.temperature}% Temp)</span>
        <span>-</span>
        <span className="text-pinto-gray-4">Amount Sown:</span>
        <span>
          {previousSeason.deltaSownBeans.toNumber().toFixed(2)}/{previousSeason.issuedSoil.toNumber().toFixed(2) || 0.0}
        </span>
        <span className="text-pinto-gray-4">
          ({((previousSeason.deltaSownBeans.toNumber() / previousSeason.issuedSoil.toNumber()) * 100 || 0).toFixed(2)}
          %)
        </span>
      </div>

      <div className="w-full h-[250px] rounded-md mt-2 flex justify-center items-center relative bg-transparent">
        {isChartReady && (
          <>
            <SoilDemandMultiLineChart
              data={mappedData}
              size="large"
              xKey="interval"
              valueFormatter={formatter.pct}
            />
            <div className="z-index-0 absolute bg-morning-light opacity-50 left-[16px] w-[50px] md:w-[90px] h-[220px] top-[7px] pointer-events-none" />
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
        {previousSeason.blocksToSoldOutSoil === "-" ? (
          <span className="text-base text-pinto-gray-4">
            Amount of Soil Sown in {previousSeason.season}: {previousSeason.deltaSownBeans.toNumber().toFixed(2)}
          </span>
        ) : (
          <span className="text-base text-pinto-gray-4">
            Soil - {previousSeason.issuedSoil.toNumber().toFixed(2)} Sown in Season {previousSeason.season}: XX:
            {previousSeason.blocksToSoldOutSoil}
          </span>
        )}
      </div>
    </div>
  );
};
