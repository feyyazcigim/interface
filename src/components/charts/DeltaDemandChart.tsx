import { diamondABI } from "@/constants/abi/diamondABI";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { SeasonsTableData } from "@/state/useSeasonsData";
import { Separator } from "@radix-ui/react-separator";
import { usePublicClient } from "wagmi";
import { Button } from "../ui/Button";

interface DeltaDemandChartProps {
  currentSeason: SeasonsTableData;
  prevSeasons: SeasonsTableData[];
}

export const DeltaDemandChart = ({ currentSeason, prevSeasons }: DeltaDemandChartProps) => {
  const lowerBound = 15000;
  const upperBound = 15000;
  const secondLowerBound = 24000;
  const secondUpperBound = 24000;
  const protocolAddress = useProtocolAddress();
  const publicClient = usePublicClient();

  const generateData = async () => {
    const sowEventsCurrentSeason = await publicClient?.getContractEvents({
      address: protocolAddress,
      abi: diamondABI,
      eventName: "Sow",
      fromBlock: BigInt(prevSeasons[0].sunriseBlock),
      toBlock: BigInt(currentSeason.sunriseBlock),
    });
    const sowEventsPrevSeason = await publicClient?.getContractEvents({
      address: protocolAddress,
      abi: diamondABI,
      eventName: "Sow",
      fromBlock: BigInt(prevSeasons[1].sunriseBlock),
      toBlock: BigInt(prevSeasons[0].sunriseBlock),
    });
    console.info("🚀 ~ DeltaDemandChart ~ sowEventsCurrentSeason:", sowEventsCurrentSeason);
    console.info("🚀 ~ DeltaDemandChart ~ sowEventsPrevSeason:", sowEventsPrevSeason);
  };

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
      <div className="w-full h-[200px] bg-pinto-gray-1 rounded-md mt-2">
        Super Slick Chart here <Button onClick={generateData}>Click me to gen chart</Button>
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
