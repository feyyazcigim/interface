import { diamondABI } from "@/constants/abi/diamondABI";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { SeasonsTableData } from "@/state/useSeasonsData";
import { Separator } from "@radix-ui/react-separator";
import { usePublicClient } from "wagmi";
import { Button } from "../ui/Button";
import { useMemo, useState } from "react";
import LineChart, { LineChartData } from "./LineChart";
import { formatter } from "@/utils/format";
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

const makeLineGradients = [metallicGreenStrokeGradientFn];

export const DeltaDemandChart = ({ currentSeason, prevSeasons }: DeltaDemandChartProps) => {
  const lowerBound = 15000;
  const upperBound = 15000;
  const secondLowerBound = 24000;
  const secondUpperBound = 24000;
  const protocolAddress = useProtocolAddress();
  const publicClient = usePublicClient();
  const [sowEventTimings, setSowEventTimings] = useState<{ blocksSinceSunrise: bigint, timestampAsMin: number, sownBeans: number }[]>([]);

  const generateData = async () => {
    const sowEventsCurrentSeason = await publicClient?.getContractEvents({
      address: protocolAddress,
      abi: diamondABI,
      eventName: "Sow",
      fromBlock: BigInt(prevSeasons[0].sunriseBlock),
      toBlock: BigInt(currentSeason.sunriseBlock),
    }) as SowEvent[];
    const sowEventsPrevSeason = await publicClient?.getContractEvents({
      address: protocolAddress,
      abi: diamondABI,
      eventName: "Sow",
      fromBlock: BigInt(prevSeasons[1].sunriseBlock),
      toBlock: BigInt(prevSeasons[0].sunriseBlock),
    }) as SowEvent[];
    const sowEventTimings = sowEventsCurrentSeason.map((event) => {
      const blocksSinceSunrise = event.blockNumber - BigInt(prevSeasons[0].sunriseBlock);
      return {
        sownBeans: Number(event.args.beans) / 1000000,
        blocksSinceSunrise,
        timestampAsMin: (Number(blocksSinceSunrise) * 2) / 60
      };
    });
    const secondSowEventTimings = sowEventsPrevSeason.map((event) => {
      const blocksSinceSunrise = event.blockNumber - BigInt(prevSeasons[1].sunriseBlock);
      return {
        sownBeans: Number(event.args.beans) / 1000000,
        blocksSinceSunrise,
        timestampAsMin: (Number(blocksSinceSunrise) * 2) / 60
      };
    });
    setSowEventTimings(sowEventTimings);
  };

  const mappedData = useMemo(() => {
    const labels: string[] = [];
    const datas: LineChartData[] = [];
    let indexesWithSowEvents: number[] = [];
    let cumulativeSownBeans = 0;
    for (let i = 0; i < 1800; i++) {
      const sowEvent = sowEventTimings.find((timing) => timing.blocksSinceSunrise === BigInt(i));
      const textInterval = `XX:${((Number(i) * 2) / 60).toFixed(2)}`
      if (sowEvent) {
        labels.push(textInterval);
        cumulativeSownBeans += sowEvent.sownBeans;
        datas.push({ values: [cumulativeSownBeans], interval: textInterval });
        indexesWithSowEvents.push(i);
      }
      else {
        labels.push(textInterval);
        datas.push({ values: [cumulativeSownBeans], interval: textInterval });
      }
    }
    return datas;
  }, [sowEventTimings]);

  return (
    <div className="w-[600px] bg-white">
      <span>Demand for Soil is increasing</span>
      <div className="flex text-sm mt-2 gap-1 items-center">
        <div className="rounded-full w-3 h-3 bg-pinto-green-4" />
        <span>Season 998</span>
        <span className="text-pinto-gray-4">(33% Temp)</span>
        <span>-</span>
        <span className="text-pinto-gray-4">Amount Sown:</span>
        <span>
          {lowerBound}/{upperBound}
        </span>
        <span className="text-pinto-gray-4">(100%)</span>
      </div>
      <div className="flex text-sm mt-2 gap-1 items-center">
        <div className="rounded-full w-3 h-3 bg-pinto-morning-yellow-1" />
        <span>Season 999</span>
        <span className="text-pinto-gray-4">(32% Temp)</span>
        <span>-</span>
        <span className="text-pinto-gray-4">Amount Sown:</span>
        <span>
          {secondLowerBound}/{secondUpperBound}
        </span>
        <span className="text-pinto-gray-4">(100%)</span>
      </div>
      <Button onClick={generateData}>Click me to gen chart</Button>
      <div className="w-full h-[200px] rounded-md mt-2">
        <LineChart
          data={mappedData}
          size="large"
          xKey="interval"
          makeLineGradients={makeLineGradients}
          valueFormatter={formatter.number}
        />
      </div>
      <Separator className="my-4" />
      <div className="flex flex-col">
        <span className="text-base">Demand for Soil</span>
        <span className="text-xl">Increasing</span>
        <span className="text-base mt-4 text-pinto-gray-4">Soil - 1 Sown a Season 998: XX:20</span>
        <span className="text-base text-pinto-gray-4">Soil - 1 Sown a Season 997: XX:25</span>
      </div>
    </div>
  );
};
