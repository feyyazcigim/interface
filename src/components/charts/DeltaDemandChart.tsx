import { diamondABI } from "@/constants/abi/diamondABI";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { SeasonsTableData } from "@/state/useSeasonsData";
import { formatter } from "@/utils/format";
import { Separator } from "@radix-ui/react-separator";
import { useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { Button } from "../ui/Button";
import LineChart, { LineChartData } from "./LineChart";
import MultiLineChart from "./MultiLineChart";
import { metallicGreenStrokeGradientFn } from "./chartHelpers";

interface DeltaDemandChartProps {
  currentSeason: SeasonsTableData;
  prevSeasons: SeasonsTableData[];
}

interface SowEvent {
  eventName: "Sow";
  address: string;
  data: string;
  args: {
    account: string;
    fieldId: bigint;
    index: bigint;
    beans: bigint;
    pods: bigint;
  };
  blockHash: string;
  blockNumber: bigint;
  logIndex: number;
  removed: boolean;
  topics: string[];
  transactionHash: string;
  transactionIndex: number;
}

interface SowEventTimings {
  events: {
    blocksSinceSunrise: bigint;
    timestampAsMin: number;
    sownBeans: number;
  }[];
  availableSoil: number;
}

const makeLineGradients = [metallicGreenStrokeGradientFn];

export const DeltaDemandChart = ({ currentSeason, prevSeasons }: DeltaDemandChartProps) => {
  const protocolAddress = useProtocolAddress();
  const publicClient = usePublicClient();
  const previouslyGeneratedData = JSON.parse(localStorage.getItem("sowEventTimings") || "{}");
  const [sowEventTimings, setSowEventTimings] = useState<Record<string, SowEventTimings>>({
    [currentSeason.season]: previouslyGeneratedData[currentSeason.season],
    [prevSeasons[0].season]: previouslyGeneratedData[prevSeasons[0].season],
  });

  const generateData = async () => {
    const sowEventsCurrentSeason = (await publicClient?.getContractEvents({
      address: protocolAddress,
      abi: diamondABI,
      eventName: "Sow",
      fromBlock: BigInt(prevSeasons[0].sunriseBlock),
      toBlock: BigInt(currentSeason.sunriseBlock),
    })) as SowEvent[];
    const sowEventsPrevSeason = (await publicClient?.getContractEvents({
      address: protocolAddress,
      abi: diamondABI,
      eventName: "Sow",
      fromBlock: BigInt(prevSeasons[1].sunriseBlock),
      toBlock: BigInt(prevSeasons[0].sunriseBlock),
    })) as SowEvent[];
    const sowEventTimings = {
      events: sowEventsCurrentSeason.map((event) => {
        const blocksSinceSunrise = event.blockNumber - BigInt(prevSeasons[0].sunriseBlock);
        return {
          sownBeans: Number(event.args.beans) / 1000000,
          blocksSinceSunrise,
          timestampAsMin: (Number(blocksSinceSunrise) * 2) / 60,
        };
      }),
      availableSoil: prevSeasons[0].issuedSoil.toNumber(),
    };
    const secondSowEventTimings = {
      events: sowEventsPrevSeason.map((event) => {
        const blocksSinceSunrise = event.blockNumber - BigInt(prevSeasons[1].sunriseBlock);
        return {
          sownBeans: Number(event.args.beans) / 1000000,
          blocksSinceSunrise,
          timestampAsMin: (Number(blocksSinceSunrise) * 2) / 60,
        };
      }),
      availableSoil: prevSeasons[1].issuedSoil.toNumber(),
    };
    const newSowEventTimings = {
      [currentSeason.season]: sowEventTimings,
      [prevSeasons[0].season]: secondSowEventTimings,
    };
    setSowEventTimings(newSowEventTimings);
    localStorage.setItem("sowEventTimings", JSON.stringify({ ...previouslyGeneratedData, ...newSowEventTimings }));
  };

  const mappedData = useMemo(() => {
    const hasTwoLines = Object.values(sowEventTimings).every((timings) => !!timings);
    const calculatedSowEventTimings = hasTwoLines
      ? sowEventTimings
      : {
          [currentSeason.season]: { events: [], availableSoil: 0 },
          [prevSeasons[0].season]: { events: [], availableSoil: 0 },
        };
    const labels: string[] = [];
    const datas: Record<number, LineChartData[]> = {};
    const indexesWithSowEvents: number[] = [];
    // number of blocks is not necessarily 1,800, depends when gm was called
    const numBlocks = Math.max(
      currentSeason.sunriseBlock - prevSeasons[0].sunriseBlock,
      prevSeasons[0].sunriseBlock - prevSeasons[1].sunriseBlock,
    );

    Object.entries(calculatedSowEventTimings).forEach(([key, timings], idx) => {
      if (!datas[idx]) {
        datas[idx] = [];
      }
      let cumulativeSownBeans = 0;
      for (let i = 0; i < numBlocks; i++) {
        const sowEvent = timings.events.find((timing) => BigInt(timing.blocksSinceSunrise) === BigInt(i));
        const timePrefix = i < 1800 ? "XX" : "XY";
        const textInterval = `${timePrefix}:${Math.trunc((Number(i) * 2) / 60)}`;
        if (sowEvent) {
          labels.push("XX");
          cumulativeSownBeans += sowEvent.sownBeans;
          datas[idx].push({
            values: [(cumulativeSownBeans / timings.availableSoil) * 100 || 0],
            interval: textInterval,
          });
          indexesWithSowEvents.push(i);
        } else {
          labels.push(textInterval);
          datas[idx].push({
            values: [(cumulativeSownBeans / timings.availableSoil) * 100 || 0],
            interval: textInterval,
          });
        }
      }
    });
    return datas;
  }, [sowEventTimings]);

  return (
    <div className="w-[600px] bg-white">
      <span>Demand for Soil is increasing</span>
      <div className="flex text-sm mt-2 gap-1 items-center">
        <div className="rounded-full w-3 h-3 bg-pinto-green-4" />
        <span>Season {prevSeasons[0].season}</span>
        <span className="text-pinto-gray-4">({prevSeasons[0].temperature}% Temp)</span>
        <span>-</span>
        <span className="text-pinto-gray-4">Amount Sown:</span>
        <span>
          {prevSeasons[0].deltaSownBeans.toNumber().toFixed(2)}/{prevSeasons[0].issuedSoil.toNumber().toFixed(2)}
        </span>
        <span className="text-pinto-gray-4">
          ({((prevSeasons[0].deltaSownBeans.toNumber() / prevSeasons[0].issuedSoil.toNumber()) * 100).toFixed(2)}%)
        </span>
      </div>
      <div className="flex text-sm mt-2 gap-1 items-center">
        <div className="rounded-full w-3 h-3 bg-pinto-morning-yellow-1" />
        <span>Season {prevSeasons[1].season}</span>
        <span className="text-pinto-gray-4">({prevSeasons[1].temperature}% Temp)</span>
        <span>-</span>
        <span className="text-pinto-gray-4">Amount Sown:</span>
        <span>
          {prevSeasons[1].deltaSownBeans.toNumber().toFixed(2)}/{prevSeasons[1].issuedSoil.toNumber().toFixed(2)}
        </span>
        <span className="text-pinto-gray-4">
          ({((prevSeasons[1].deltaSownBeans.toNumber() / prevSeasons[1].issuedSoil.toNumber()) * 100).toFixed(2)}%)
        </span>
      </div>
      <Button onClick={generateData}>Click me to gen chart</Button>
      <div className="w-full h-[200px] rounded-md mt-2">
        <MultiLineChart
          data={mappedData}
          size="large"
          xKey="interval"
          makeLineGradients={makeLineGradients}
          valueFormatter={formatter.pct}
        />
      </div>
      <Separator className="my-4" />
      <div className="flex flex-col">
        <span className="text-base">Demand for Soil</span>
        <span className="text-xl">Increasing</span>
        {prevSeasons[0].blocksToSoldOutSoil === "-" ? (
          <span className="text-base mt-4 text-pinto-gray-4">
            Amount of Soil Sown in {prevSeasons[0].season}: {prevSeasons[0].deltaSownBeans.toNumber().toFixed(2)}
          </span>
        ) : (
          <span className="text-base mt-4 text-pinto-gray-4">
            Soil - {prevSeasons[0].issuedSoil.toNumber().toFixed(2)} Sown in Season {prevSeasons[0].season}: XX:
            {prevSeasons[0].blocksToSoldOutSoil}
          </span>
        )}
        {prevSeasons[1].blocksToSoldOutSoil === "-" ? (
          <span className="text-base mt-4 text-pinto-gray-4">
            Amount of Soil Sown in {prevSeasons[1].season}: {prevSeasons[1].deltaSownBeans.toNumber().toFixed(2)}
          </span>
        ) : (
          <span className="text-base mt-4 text-pinto-gray-4">
            Soil - {prevSeasons[1].issuedSoil.toNumber().toFixed(2)} Sown in Season {prevSeasons[1].season}: XX:
            {prevSeasons[1].blocksToSoldOutSoil}
          </span>
        )}
      </div>
    </div>
  );
};
