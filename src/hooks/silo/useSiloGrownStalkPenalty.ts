import { TV } from "@/classes/TokenValue";
import { STALK } from "@/constants/internalTokens";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { Token } from "@/utils/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useReadContracts } from "wagmi";
import { useSiloConvertResult } from "./useSiloConvertResult";

export interface SiloConvertGrownStalkPenaltyBreakdown {
  newGrownStalk: TV;
  lossGrownStalk: TV;
  isPenalty: boolean;
  penaltyRatio: number;
  bdv: TV;
}

const selectGrownStalkPenalty = (result: readonly [bigint, bigint], bdv: TV) => {
  const newGrownStalk = TV.fromBigInt(result[0], STALK.decimals);
  const lossGrownStalk = TV.fromBigInt(result[1], STALK.decimals);

  const totalGrownStalk = newGrownStalk.add(lossGrownStalk);

  const isPenalty = lossGrownStalk.gt(0);
  const penaltyRatio = isPenalty ? lossGrownStalk.div(totalGrownStalk).toNumber() : 0;

  return {
    newGrownStalk,
    lossGrownStalk,
    isPenalty,
    penaltyRatio,
    bdv,
  };
};

const selectGrownStalkPenaltyMultiple = (results: (readonly [bigint, bigint])[], bdvValues: TV[]) => {
  return results.map((result, index) => selectGrownStalkPenalty(result, bdvValues[index]));
};

export const useSiloConvertDownPenaltyQuery = (
  source: Token,
  target: Token | undefined,
  result: ReturnType<typeof useSiloConvertResult>["results"],
  enabled: boolean = true,
) => {
  const [structs, setStructs] = useState<SiloConvertGrownStalkPenaltyBreakdown[] | undefined>(undefined);
  const diamond = useProtocolAddress();

  const isConvertDown = Boolean(source.isMain && target?.isLP);

  const { contractArgs, isValidArgs } = useMemo(() => {
    const args = result?.map((r) => {
      return {
        fromGrownStalk: r.fromGrownStalk,
        fromBdv: r.fromBdv,
        well: isConvertDown ? target : undefined,
      };
    });

    const allHaveWells = args?.every((r) => r.well);
    const allHaveBdv = args?.every((r) => r.fromBdv.gt(0));

    return {
      contractArgs: args,
      isValidArgs: Boolean(allHaveWells && allHaveBdv && args?.length),
    };
  }, [result]);

  const queryEnabled = isValidArgs && !!contractArgs?.length && isConvertDown && enabled;

  const bdvValues = useMemo(() => contractArgs?.map((r) => r.fromBdv) ?? [], [contractArgs]);

  const selectData = useCallback(
    (data: (readonly [bigint, bigint])[]) => selectGrownStalkPenaltyMultiple(data, bdvValues),
    [bdvValues],
  );

  const queries = useReadContracts({
    contracts: (contractArgs ?? [])?.map((r) => {
      return {
        address: diamond,
        abi: abi,
        functionName: "downPenalizedGrownStalk",
        args: [r.well?.address ?? "0x", r.fromBdv.toBigInt(), r.fromGrownStalk.toBigInt()],
      };
    }),
    allowFailure: false,
    query: {
      enabled: queryEnabled,
      select: selectData,
    },
  });

  useEffect(() => {
    const amts = queries.data?.map((r) => r.lossGrownStalk ?? TV.ZERO);
    const structAmts = structs?.map((r) => r.lossGrownStalk ?? TV.ZERO);

    if (amts && structAmts && amts.every((amt, i) => amt.eq(structAmts[i] ?? TV.ZERO))) return;

    if (amts?.every((amt, i) => amt.eq(structAmts?.[i] ?? TV.ZERO))) return;

    queries.data && setStructs(queries.data);
  }, [queries]);

  return {
    ...queries,
    data: structs,
  };
};

const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "well",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "bdvToConvert",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "grownStalkToConvert",
        type: "uint256",
      },
    ],
    name: "downPenalizedGrownStalk",
    outputs: [
      {
        internalType: "uint256",
        name: "newGrownStalk",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "grownStalkLost",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
