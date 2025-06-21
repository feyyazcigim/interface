import { TV } from "@/classes/TokenValue";
import { STALK } from "@/constants/internalTokens";
import { SiloConvertSummary } from "@/lib/siloConvert/SiloConvert";
import { SiloConvertType } from "@/lib/siloConvert/strategies/core";
import { useSiloData } from "@/state/useSiloData";
import { SiloTokenData, Token } from "@/utils/types";
import { useMemo } from "react";

const defaultData = {
  germinatingStalk: TV.ZERO,
  germinatingSeasons: 0,
  totalAmountOut: TV.ZERO,
  toTotalStalk: TV.ZERO,
  toInitialStalk: TV.ZERO,
  toGrownStalk: TV.ZERO,
  toSeed: TV.ZERO,
  fromTotalStalk: TV.ZERO,
  fromInitialStalk: TV.ZERO,
  fromGrownStalk: TV.ZERO,
  fromSeed: TV.ZERO,
  deltaBdv: TV.ZERO,
  fromBdv: TV.ZERO,
  toBdv: TV.ZERO,
};

export type SiloConvertResultResult = typeof defaultData & {
  deltaInitialStalk: TV;
  deltaGrownStalk: TV;
  deltaStalk: TV;
  deltaSeed: TV;
};

export interface IUseSiloConvertResultReturnType {
  results: SiloConvertResultResult[] | undefined;
  sortedIndexes: number[] | undefined;
}

export function useSiloConvertResult(
  source: Token,
  target: Token | undefined,
  summaries: SiloConvertSummary<SiloConvertType>[] | undefined,
): IUseSiloConvertResultReturnType {
  const silo = useSiloData();
  const siloTokenData = silo.tokenData;

  const results = useMemo(() => {
    if (!summaries || !target || !summaries.length) return;

    const sourceData = siloTokenData.get(source);
    const targetData = siloTokenData.get(target);

    if (!targetData || !sourceData) return;

    const calcs = summaries.reduce<(typeof defaultData)[]>((memo, summary) => {
      memo.push(reduceSummary(summary, targetData));
      return memo;
    }, []);

    const data = calcs.map((calc) => {
      const deltaInitialStalk = calc.toInitialStalk.sub(calc.fromInitialStalk);
      const deltaGrownStalk = calc.toGrownStalk.sub(calc.fromGrownStalk);
      const deltaStalk = deltaInitialStalk.add(deltaGrownStalk);
      const deltaSeed = calc.toSeed.sub(calc.fromSeed);

      return {
        ...calc,
        deltaInitialStalk,
        deltaGrownStalk,
        deltaStalk,
        deltaSeed,
      };
    });

    return data;
  }, [summaries, siloTokenData, source, target]);

  const sortedIndexes = useMemo(() => {
    if (!results) return;

    const sortedIndexes = [...results]
      .map((result, index) => ({ ...result, index }))
      .sort((a, b) => {
        const aBDV = a.toBdv;
        const bBDV = b.toBdv;
        const aGrownStalk = a.toGrownStalk;
        const bGrownStalk = b.toGrownStalk;

        if (aBDV.gt(bBDV)) return -1;
        if (aBDV.lt(bBDV)) return 1;
        if (aGrownStalk.gt(bGrownStalk)) return -1;
        if (aGrownStalk.lt(bGrownStalk)) return 1;

        return 0;
      })
      .map((r) => r.index);

    return sortedIndexes;
  }, [results]);

  return {
    results,
    sortedIndexes,
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// Compare Convert Results
// ────────────────────────────────────────────────────────────────────────────────

const reduceSummary = (summary: SiloConvertSummary<SiloConvertType>, targetTokenData: SiloTokenData) => {
  const targetRewards = targetTokenData.rewards;
  const targetStemTip = targetTokenData.stemTip;

  return summary.results.reduce<typeof defaultData>(
    (prev, result, i) => {
      const quote = summary.quotes[i];
      const { pickedCrates: picked } = quote;

      const resultToStem = result.toStem;
      const willGerminate = resultToStem.gte(targetStemTip);
      const germinatingSeasons = willGerminate ? (resultToStem.eq(targetStemTip) ? 2 : 1) : 0;

      const targetDeltaStem = targetStemTip.sub(result.toStem);
      const grownStalkBigInt = willGerminate ? 0n : targetDeltaStem.toBigInt() * result.toBdv.toBigInt();

      const toInitialStalk = result.toBdv.reDecimal(STALK.decimals);
      const toGrownStalk = TV.fromBigInt(grownStalkBigInt, STALK.decimals);
      const toTotalStalk = toInitialStalk.add(toGrownStalk);
      const toSeed = targetRewards.seeds.mul(result.toBdv);
      const fromBdv = picked.totalBDV;

      const toBdv = result.toBdv;
      const deltaBdv = toBdv.sub(fromBdv);

      const struct: typeof defaultData = {
        germinatingStalk: willGerminate ? prev.germinatingStalk.add(toInitialStalk) : TV.ZERO,
        germinatingSeasons: willGerminate && !prev.germinatingSeasons ? germinatingSeasons : prev.germinatingSeasons,
        totalAmountOut: prev.totalAmountOut.add(result.toAmount),
        toTotalStalk: willGerminate ? prev.toTotalStalk : prev.toTotalStalk.add(toTotalStalk),
        toInitialStalk: prev.toInitialStalk.add(toInitialStalk),
        toGrownStalk: prev.toGrownStalk.add(toGrownStalk),
        toSeed: prev.toSeed.add(toSeed),
        fromTotalStalk: prev.fromTotalStalk.add(picked.totalStalk),
        fromInitialStalk: prev.fromInitialStalk.add(picked.totalInitialStalk),
        fromGrownStalk: prev.fromGrownStalk.add(picked.totalGrownStalkSinceDeposit),
        fromSeed: prev.fromSeed.add(picked.totalSeeds),
        deltaBdv: prev.deltaBdv.add(deltaBdv),
        fromBdv: prev.fromBdv.add(fromBdv),
        toBdv: prev.toBdv.add(toBdv),
      };

      return struct;
    },
    { ...defaultData },
  );
};
// ────────────────────────────────────────────────────────────────────────────────
// Extract Price data from Convert quotes
// ────────────────────────────────────────────────────────────────────────────────

export function useExtractSiloConvertResultPriceResults(
  summaries: (SiloConvertSummary<SiloConvertType> | undefined)[] | undefined,
) {
  return useMemo(() => {
    if (!summaries) return;

    return summaries.map((summary) => summary?.postPriceData);
  }, [summaries]);
}
