import { diamondABI } from "@/constants/abi/diamondABI";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";

export interface UseSowEventDataReturn {
  isFetching: boolean;
  data: SowEvent[];
}

export interface SowEvent {
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

export default function useSowEventData(fromBlock: number, toBlock: number): UseSowEventDataReturn {
  const [sowEvents, setSowEvents] = useState<SowEvent[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const protocolAddress = useProtocolAddress();
  const publicClient = usePublicClient();
  const getSowEvents = async () => {
    if (!fromBlock || !toBlock) {
      setSowEvents([]);
      setIsFetching(false);
      return;
    }
    setIsFetching(true);
    const sowEvents = (await publicClient?.getContractEvents({
      address: protocolAddress,
      abi: diamondABI,
      eventName: "Sow",
      fromBlock: BigInt(fromBlock),
      toBlock: BigInt(toBlock),
    })) as SowEvent[];
    setSowEvents(sowEvents);
    setIsFetching(false);
  };

  useEffect(() => {
    getSowEvents();
  }, [fromBlock, toBlock]);

  return {
    isFetching,
    data: sowEvents,
  };
}
