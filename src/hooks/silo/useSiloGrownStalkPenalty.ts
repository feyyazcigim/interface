import { TV } from "@/classes/TokenValue";
import { diamondABI } from "@/constants/abi/diamondABI";
import { STALK } from "@/constants/internalTokens";
import { useProtocolAddress } from "@/hooks/pinto/useProtocolAddress";
import { FailableUseContractsResult, Token } from "@/utils/types";
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

  const bdvValues = useMemo(() => result?.map((r) => r.fromBdv), [result]);

  const select = useCallback(
    (data: (readonly [bigint, bigint])[]) => {
      return selectGrownStalkPenaltyMultiple(data, bdvValues ?? []);
    },
    [bdvValues],
  );

  const args = result?.map((r) => {
    return {
      fromGrownStalk: r.fromGrownStalk,
      fromBdv: r.fromBdv,
      well: isConvertDown ? target : undefined,
      fromAmount: r.fromAmountIn,
    };
  });

  const isValidArgs = args?.every((r) => r.well && r.fromBdv.gt(0) && r.fromAmount.gt(0));
  const queryEnabled = isValidArgs && !!args?.length && isConvertDown && enabled;

  const { data: queryData, ...queries } = useReadContracts({
    contracts: (args ?? [])?.map((r) => {
      return {
        address: diamond,
        abi: diamondABI,
        functionName: "downPenalizedGrownStalk" as const,
        args: [
          r.well?.address ?? "0x",
          r.fromBdv.toBigInt(),
          r.fromGrownStalk.toBigInt(),
          r.fromAmount.toBigInt(),
        ] as const,
      };
    }),
    allowFailure: false,
    query: {
      enabled: queryEnabled,
      select,
    },
  });

  useEffect(() => {
    const amts = queryData?.map((r) => r.lossGrownStalk ?? TV.ZERO);
    const structAmts = structs?.map((r) => r.lossGrownStalk ?? TV.ZERO);

    if (amts && structAmts && amts?.every((amt, i) => amt.eq(structAmts?.[i] ?? TV.ZERO))) return;

    if (amts?.every((amt, i) => amt.eq(structAmts?.[i] ?? TV.ZERO))) return;

    queryData && setStructs(queryData);
  }, [queryData]);

  return useMemo(
    () => ({
      ...queries,
      data: structs,
    }),
    [queries, structs],
  );
};
